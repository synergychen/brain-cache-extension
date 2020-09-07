'use strict';

chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });

  // When url changes
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      chrome.tabs.sendMessage(tabId, {
        message: 'TabUpdated'
      })
      chrome.storage.sync.get('lastUpdated', ({ lastUpdated }) => {
        const text = ''
        const startTime = lastUpdated
        const endTime = Date.now()
        const maxResults = 10000
        chrome.history.search({ text, startTime, endTime, maxResults }, function (data) {
          // {"id":"83586","lastVisitTime":1597610228420.501,"title":"S3 Management Console","typedCount":2,"url":"https://s3.console.aws.amazon.com/s3/home?region=us-east-1","visitCount":32}
          // alert(JSON.stringify(data[0]))
          // data.forEach(function (page) {
          //   alert(JSON.stringify(page))
          // })
        })
      })
    }
  })
});
