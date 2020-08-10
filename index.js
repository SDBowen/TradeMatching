const util = require("util");

// Models

function Trade(quantity, price, type) {
  this.id = Math.floor(Math.random() * 9999) + 1;
  this.quantity = quantity;
  this.price = price;
  this.type = type;
  this.date = Date.now();
  this.transactions = [];
}

function Order(trade) {
  this.tradeId = trade.id;
  this.type = trade.type;
  this.quantity = trade.quantity;
  this.price = trade.price;
  this.date = trade.date;
}

function Transaction(tradeId, quantity, price) {
  this.tradeId = tradeId;
  this.quantity = quantity;
  this.price = price;
  this.date = Date.now();
}

// Trade Service recieves and updates existing buy/sell ordeers

const tradeService = {
  trades: [],
  create: (request) => {
    const { quantity, price, type } = request;
    const trade = new Trade(quantity, price, type);

    tradeService.trades.push(trade);

    orderService.processOrder(new Order(trade));
  },
  addTransaction: (id, transaction) => {
    const trade = tradeService.trades.find((trade) => trade.id === id);

    trade.transactions.push(transaction);
  },
};

// Order Service processes a trade into an order; adding it to the sell/buy
// queue or forwarding to Match Service

const orderService = {
  sellOrders: [],
  buyOrders: [],
  processOrder: (order) => {
    const buyOrder = order.type === "BUY";
    const orders = buyOrder ? orderService.sellOrders : orderService.buyOrders;

    const canFill = buyOrder
      ? order.price >= orders[0]?.price
      : order.price <= orders[0]?.price;

    if (!canFill) {
      orderService.addOrder(buyOrder, order);
    } else {
      matchService.match(order, orders);
    }
  },
  addOrder: (buyOrder, order) => {
    const { sellOrders, buyOrders } = orderService;

    if (buyOrder) {
      buyOrders.push(order);
      buyOrders.sort((a, b) => b.price - a.price || a.date - b.date);
    } else {
      sellOrders.push(order);
      sellOrders.sort((a, b) => a.price - b.price || a.date - b.date);
    }
  },
};

// Match Service pairs a buy and sell order

const matchService = {
  match: (order, orders) => {
    const matchingOrder = orders[0];
    const { tradeId, price } = matchingOrder;

    const transaction = new Transaction(tradeId, null, price);

    if (order.quantity < matchingOrder.quantity) {
      transaction.quantity = order.quantity;
      matchingOrder.quantity -= order.quantity;

      return tradeService.addTransaction(order.tradeId, transaction);
    }

    if (order.quantity > matchingOrder.quantity) {
      orders.shift();
      transaction.quantity = matchingOrder.quantity;
      order.quantity -= matchingOrder.quantity;
      tradeService.addTransaction(order.tradeId, transaction);

      return orderService.processOrder(order);
    }

    orders.shift();
    transaction.quantity = order.quantity;

    return tradeService.addTransaction(order.tradeId, transaction);
  },
};

// Seed Data

const repeat = (times) => {
  const quantity = Math.floor(Math.random() * 99) + 1;
  const price = Math.floor(Math.random() * 9) + 1;
  const type = Math.random() >= 0.5 ? "BUY" : "SELL";

  tradeService.create({
    quantity,
    price,
    type,
  });

  times && --times && repeat(times);
};

repeat(50);

tradeService.trades.forEach((trade) => {
  console.log(util.inspect(trade, false, null, true));
});
