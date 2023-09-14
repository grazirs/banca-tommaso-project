"use strict"
const BASE_URL = 'https://tommaso-bank.netlify.app/.netlify/functions/cards';

const VISA_ICON = './assets/visa.svg';
const MASTERCARD_ICON = './assets/mastercard.svg';

const SCREEN_HEIGHT = window.innerHeight;
const HEADER = 130;

let selectedCard;
let firstCard;
let cards = [];
let transactions = [];


async function getCards() {
  const response = await fetch(BASE_URL);
  const data = await response.json();
  return data;
}

function buildExpandedCard(card, animate) {
  const updateDate = new Date(card.lastUpdateAt).toLocaleDateString();
  const expirationDate = new Date(card.expiration).toLocaleDateString("en-GB", { month: '2-digit', year: 'numeric' });
  const circuitCard = card.circuit === 'MASTERCARD' ? MASTERCARD_ICON : VISA_ICON;
  const maskedNumber = card.number.substr(-4);
  const animation = animate ? 'expand-card 1s' : 'none';

  return `
  <div class="collapsible-card" role="region" aria-expanded="true" data-loaded="true" style="animation:${animation}">
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

function buildNotExpandedCard(card, isPreviousSelected) {
  const circuitCard = card.circuit === 'MASTERCARD' ? MASTERCARD_ICON : VISA_ICON;
  const maskedNumber = card.number.substr(-4);

  const animation = isPreviousSelected ? 'reduce-card 0.5s' : 'none';
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
  <div class="collapsible-card" role="region" aria-expanded="false" style="animation: ${animation} ">
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
  const transactionsContent = document.getElementById('description-content');
  transactionsContent.onscroll = infiniteScroll;

  buildCardsSkeleton();
  buildTransactionsSkeleton();

  cards = await getCards();

  selectedCard = cards[0];

  renderCards();

  transactions = await getTransactions(selectedCard);
  renderTransactions(transactions);
});

function renderCards(previousSelectedCard) {
  const cardsContainer = document.querySelector('.cards-container');
  cardsContainer.innerHTML = '';

  cards.forEach(card => {
    let built = '';
    if(card.id === selectedCard.id){
      const animate = previousSelectedCard !== undefined;
      built = buildExpandedCard(card, animate);

    } else {
      const isPreviousSelected  = card.id === previousSelectedCard?.id;
      built = buildNotExpandedCard(card, isPreviousSelected);
    }
    cardsContainer.insertAdjacentHTML('beforeend', built);
    cardsContainer.lastElementChild.addEventListener("click", function(){
      onClickCard(card);
    })
  });
}

async function onClickCard(card) {
  const previousSelectedCard = selectedCard;
  selectedCard = card;
  renderCards(previousSelectedCard);
  buildTransactionsSkeleton();
  transactions = await getTransactions();
  renderTransactions(transactions);
}

async function getTransactions(){
  const response = await fetch(`${BASE_URL}/transactions/${selectedCard.id}`)
  const data = await response.json();
  return data;
}

function buildTransactions(transaction) {
  const date = new Date(transaction.date).toLocaleDateString();
  const cardNumber = selectedCard.number.substr(-4);

  return `
  <div class="description-content">
    <div class="description">
    <span>${transaction.description}</span>
    <span class="description-tag">${selectedCard.name} ... ${cardNumber}</span>
  </div>
    <span class="date">${date}</span>
    <span class="amount">${transaction.amount} €</span>
  </div>
  `;
}

async function renderTransactions(transactions) {
  const transactionsContainer = document.querySelector('#description-content');
  transactionsContainer.innerHTML = '';

  function compareDates(a, b) {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    if (dateA < dateB) {
      return 1;
    } else if (dateA > dateB) {
      return -1;
    } else {
      return 0;
    }
  }

  transactions.sort(compareDates);

  transactions.forEach((transaction) => {
    const builtTransaction = buildTransactions(transaction);
    return  transactionsContainer.insertAdjacentHTML('beforeend', builtTransaction)
  })
}

function skeletonTransactionsHTML(){
  let transactionsSkeleton = '';

  for (let i = 0; i < numberOfSkeletonTransactionRows(); i++) {
    transactionsSkeleton +=  `
      <div class="description-content">
        <div class="description">
          <span class="skeleton skeleton-place"></span>
          <span class="description-tag skeleton skeleton-tag"></span>
        </div>
        <span class="date skeleton skeleton-date"></span>
        <span class="amount skeleton skeleton-amount"></span>
      </div>
    `;
  }
  return transactionsSkeleton;
}

function buildTransactionsSkeleton(){
  const descriptionContent = document.getElementById('description-content');
  return descriptionContent.innerHTML = skeletonTransactionsHTML();
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

async function loadNextGroupOfTransaction(date){
  const response = await fetch(`${BASE_URL}/transactions/${selectedCard.id}?lastTransactionDate=${date}`);
  const data = await response.json();
  return data;
}

async function infiniteScroll() {
  const transactionsContent = document.getElementById('description-content');
  const scrollableHeight = transactionsContent.scrollHeight - transactionsContent.clientHeight;

  if (transactionsContent.scrollTop >= scrollableHeight) {

    transactionsContent .insertAdjacentHTML('beforeend', skeletonTransactionsHTML());

    const lastTransaction = transactions[transactions.length - 1];
    const lastTransactionDate = lastTransaction.date;
    const newTransactions = await loadNextGroupOfTransaction(lastTransactionDate);

    if (newTransactions.length > 0) {
      transactions.push(...newTransactions);
      renderTransactions(transactions);
    }
  }
}
