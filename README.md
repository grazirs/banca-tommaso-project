## DESCRIPTION

The Growth team at Banca Tommaso is building a Minimum Viable Product (MVP) for a new product to launch on the market. It's a Personal Finance Management (PFM) web app that allows you to manage all your different payment cards in one place.

### GOALS

- Implementing design specs
- Using undocumented APIs
- Inferring business logic from APIs
- Using core web concept without a framework

Design specs:

- https://xd.adobe.com/view/da4cd4d0-8c6f-4b7a-af8d-af0c76b17e83-8f1f/grid

Endpoints:

- https://tommaso-bank.netlify.app/.netlify/functions/cards to get a list of all cards
- https://tommaso-bank.netlify.app/.netlify/functions/cards/transactions/insertCardId to get the transactions of a specific card.

### TASKS

1. Implement the screen "Show data" from the design specs. After getting the list of cards, put the first one you find as the selected one and load the transactions for that card. The other cards are not clickable.
2. While loading data, implement the screen "Loading Data."
3. Implement an infinite scroll on the list of transactions. Every time the user reaches the bottom of the list, you have to load the next group of transactions. To do this, you can add the lastTransactionDate query parameter to the transactions endpoint. You have to pass the date in the ISO 8601 format.
4. When I click a closed card, the selected one closes, and the clicked one becomes the active one, and its transactions are loaded.
5. Add a transition when the user selects a card.
