"use strict"
const BASE_URL = 'https://tommaso-bank.netlify.app/.netlify/functions/cards';

const VISA_ICON = './assets/visa.svg';
const MASTERCARD_ICON = './assets/mastercard.svg';

const SCREEN_HEIGHT = window.innerHeight;
const HEADER = 130;

let selectedCardID;
let firstCard;
let cards = [];
let transactions = [];


async function getCards() {
  const response = await fetch(BASE_URL);
  const data = await response.json();
  return data;
}

function buildExpandedCard(card) {
  const updateDate = new Date(card.lastUpdateAt).toLocaleDateString();
  const expirationDate = new Date(card.expiration).toLocaleDateString("en-GB", { month: '2-digit', year: 'numeric' });
  const circuitCard = card.circuit === 'MASTERCARD' ? MASTERCARD_ICON : VISA_ICON;
  const maskedNumber = card.number.substr(-4);

  return `
  <div class="collapsible-card" role="region" aria-expanded="true" data-loaded="true">
  <div class="card" role="button" aria-controls="card-content" tabindex="0">
    <div class="card-content" id="card-content" aria-hidden="false">
    <div class="card-header">
    <img class="bank-logo" src="${card.logo}" alt="card logo">
    <span class="bank-name">${card.name}</span>
    </div>
    <div>
    <span class="last-update">Last Update:</span><span class="date">
    ${updateDate}</span>
  </div>
  <div class="card-footer">
    <div>
      <div>Card Number</div>
      <div class="card-number">
        <span>···· ···· ···· </span>
        <span> ${maskedNumber}</span>
      </div>
    </div>
    <div class="card-expiration">
      <div class="expiration-title">Expiration</div>
      <div class="expiration-date">${expirationDate}</div>
    </div>
    <div class="card-flag">
    <img src="${circuitCard}" alt="card flag">
    <span>${card.type}</span>
    </div>
  </div>
    </div>
  </div>
</div>

  `
}

function buildNotExpandedCard(card) {
  const circuitCard = card.circuit === 'MASTERCARD' ? MASTERCARD_ICON : VISA_ICON;
  const maskedNumber = card.number.substr(-4);

  let cardStatusTag = ``;

  if (card.status === "INACTIVE") {
    cardStatusTag = `<span class="status-tag">Disconnected</span> `
  } else {
    cardStatusTag = `<div class="card-number-2">
    <span>···· ···· ···· </span>
    <span> ${maskedNumber}</span>
  </div>`
  }

  return `
  <div class="collapsible-card" role="region" aria-expanded="false">
  <div class="card" role="button" aria-controls="card-content" tabindex="0">
    <div class="card-content" id="card-content" aria-hidden="false">
      <div class="card-header-2">
        <img class="bank-logo" src="${card.logo}" alt="card logo">

        <div id="account-details">
          <div class="tag">
            <span class="bank-name">${card.name}</span>
              ${cardStatusTag}
          </div>
        </div>

        <div class="card-flag">
          <img src="${circuitCard}" alt="card flag">
          <span>${card.type}</span>
        </div>
      </div>
    </div>
  </div>
</div>
  `
}

window.addEventListener('load', async function () {
  buildCardsSkeleton();
  buildTransactionsSkeleton();

  cards = await getCards();

  firstCard = cards[0];
  selectedCardID = firstCard.id;;

  renderCards();

  transactions = await getTransactions(selectedCardID);
  renderTransactions(transactions, firstCard);
});

function renderCards() {
  const cardsContainer = document.querySelector('.cards-container');
  cardsContainer.innerHTML = '';
  cards.forEach(card => {
    const built = card.id === selectedCardID ? buildExpandedCard(card) : buildNotExpandedCard(card)
    cardsContainer.insertAdjacentHTML('beforeend', built);
    cardsContainer.lastElementChild.addEventListener("click", function(){
      onClickCard(card);
    })
  });
}

async function onClickCard(card) {
  selectedCardID = card.id;
  renderCards();

  buildTransactionsSkeleton();
  transactions = await getTransactions(selectedCardID);
  renderTransactions(transactions, card);
}

async function getTransactions(selectedCardID){
  const response = await fetch(`${BASE_URL}/transactions/${selectedCardID}`)
  const data = await response.json();
  return data;
}

function buildTransactions(transaction, card) {
  const allDescription = transaction.description;
  const indexAt = allDescription.indexOf("at");
  const indexUsing = allDescription.indexOf("using", indexAt);
  const place = allDescription.slice(indexAt + 3, indexUsing).trim();
  const date = new Date(card.lastUpdateAt).toLocaleDateString();
  const cardNumber = card.number.substr(-4);

  return `
  <div class="description-content">
    <div class="description">
    <span>${place}</span>
    <span class="description-tag">${card.name} ... ${cardNumber}</span>
  </div>
    <span class="date">${date}</span>
    <span class="amount">${transaction.amount} €</span>
  </div>
  `;
}

async function renderTransactions(transactions, card) {
  const transactionsContainer = document.querySelector('#description-content');
  transactionsContainer.innerHTML = '';

  transactions.forEach((transaction) => {
    const builtTransaction = buildTransactions(transaction, card);
    return  transactionsContainer.insertAdjacentHTML('beforeend', builtTransaction)})
}

function buildTransactionsSkeleton(){
  const descriptionContent = document.getElementById('description-content');

  let transactionsSkeleton = '';

  for(let i = 0; i < numberOfSkeletonTransactionRows(); i++){
    transactionsSkeleton +=  `
    <div class="description-content">
    <div class="description">
      <span class="skeleton skeleton-place"></span>
      <span class="description-tag skeleton skeleton-tag"></span>
    </div>
    <span class="date skeleton skeleton-date"></span>
    <span class="amount skeleton skeleton-amount"></span>
  </div>
  `
  }

  return descriptionContent.innerHTML = transactionsSkeleton;
}

function buildCardsSkeleton(){
  const cardsContainer = document.querySelector('.cards-container');
  let cardExpanded = "";
  let cardNotExpanded = "";

  cardExpanded = `
  <div id="collapsible-card" class="collapsible-card skeleton" role="region" aria-expanded="true"
  data-loaded="false">
  </div>
  `;

  for(let i = 0; i < numberOfSkeletonNotExpandedCards(); i++){
    cardNotExpanded += `
    <div id="collapsible-card" class="collapsible-card skeleton" role="region" aria-expanded="false">
    </div>
    `
  }

  return cardsContainer.innerHTML = cardExpanded + cardNotExpanded;
}

function numberOfSkeletonTransactionRows(){
  const ROW_HEIGHT= 77;
  const NUMBER_OF_ROWS = Math.round((SCREEN_HEIGHT  - HEADER) / ROW_HEIGHT);
  return NUMBER_OF_ROWS;
}

function numberOfSkeletonNotExpandedCards(){
  const NOT_EXPANDED_CARD_HEIGHT= 72;
  const EXPANDED_CARD_HEIGHT= 192;
  const NUMBER_OF_CARDS = Math.round((SCREEN_HEIGHT - HEADER - EXPANDED_CARD_HEIGHT) / NOT_EXPANDED_CARD_HEIGHT);
  return NUMBER_OF_CARDS;
}
