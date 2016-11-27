module.exports = function (store, userId, abstract) {
  store.goTo(['userStore', userId]).set('abstract', abstract);
};