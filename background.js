function isEmpty(obj) {
  if (obj) return Object.keys(obj).length === 0;
  return true;
}

let preventInstance = {};

function startJustRead(tab) {
  if (tab) {
    executeScripts(tab.id);
  } else {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabArray) => {
      if (tabArray.length) executeScripts(tabArray[0].id);
    });
  }
}

function executeScripts(tabId) {
  if (preventInstance[tabId]) return;

  preventInstance[tabId] = true;
  setTimeout(() => delete preventInstance[tabId], 10000);

  // Add a badge to signify the extension is in use
  chrome.action.setBadgeBackgroundColor({ color: [242, 38, 19, 230] });
  chrome.action.setBadgeText({ text: "on" });

  // Check if we need to add the site to JR's autorun list
  chrome.storage.sync.get("alwaysAddAR", function (result) {
    if (result && result["alwaysAddAR"]) {
      addSiteToAutorunList(null, tab);
    }
  });

  // Load our external scripts, then our content script
  chrome.scripting
    .executeScript({
      target: { tabId: tabId, allFrames: false },
      files: [
        "/external-libraries/readability/readability.js",
        "/external-libraries/datGUI/dat.gui.min.js",
        "/external-libraries/DOMPurify/purify.min.js",
        "/external-libraries/Rangy/rangy.min.js",
        "/external-libraries/Rangy/rangy-classapplier.min.js",
        "/external-libraries/Rangy/rangy-highlighter.min.js",
        "/external-libraries/Rangy/rangy-textrange.min.js",
      ],
    })
    .then(() => {
      chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: false },
        files: ["content_script.js"],
      });

      setTimeout(function () {
        chrome.action.setBadgeText({ text: "" });
        chrome.storage.sync.set({ useText: false });
        chrome.storage.sync.set({ runOnLoad: false });
      }, 1000);
    });
}

function startSelectText() {
  chrome.storage.sync.set({ useText: true });
  startJustRead();
}

// Thêm hàm mở tab mới hỗ trợ extensions
function openNewTabWithExtensions() {
  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    if (tabs.length > 0) {
      const currentUrl = tabs[0].url;
      chrome.tabs.create({ 
        url: currentUrl,
        active: true,
        openerTabId: tabs[0].id
      });
    }
  });
}

function createPageCM() {
  // Create a right click menu option
  pageCMId = chrome.contextMenus.create(
    {
      title: "Xem trang này bằng Just Read Việt",
      id: "pageCM",
      contexts: ["page"],
    },
    chrome.runtime.lastError
  );
}
function createLinkCM() {
  // Create an entry to allow user to open a given link using Just read
  linkCMId = chrome.contextMenus.create(
    {
      title: "Xem trang liên kết bằng Just Read Việt",
      id: "linkCM",
      contexts: ["link"],
    },
    chrome.runtime.lastError
  );
}

function createNewTabCM() {
  // Create a context menu entry to open current page in new tab
  newTabCMId = chrome.contextMenus.create(
    {
      title: "Mở tab mới với Just Read Việt (Alt+I)",
      id: "newTabCM",
      contexts: ["page"],
    },
    chrome.runtime.lastError
  );
}

function createAutorunCM() {
  // Create an entry to allow user to open a given link using Just read
  autorunCMId = chrome.contextMenus.create(
    {
      title: "Thêm trang này vào danh sách tự động chạy của Just Read Việt",
      id: "autorunCM",
      contexts: ["page"],
    },
    chrome.runtime.lastError
  );
}
function addSiteToAutorunList(info, tab) {
  chrome.storage.sync.get("auto-enable-site-list", function (result) {
    let url = new URL((info != null && info.pageUrl) || tab.url);
    let entry;
    if (url.pathname !== "/" && url.pathname !== "") {
      entry = url.hostname + "/.+";
    } else {
      entry = url.hostname;
    }

    let currentDomains = result["auto-enable-site-list"];

    if (!isEmpty(currentDomains)) {
      if (!currentDomains.includes(entry)) {
        chrome.storage.sync.set(
          {
            "auto-enable-site-list": [...currentDomains, entry],
          },
          function () {
            if (currentDomains.indexOf(url.hostname)) {
              console.log(
                "Just Read đã thêm mục tự chạy.\n\nCảnh báo: Một mục tự chạy với cùng tên miền đã được thêm trước đó. Hãy cẩn thận để không thêm hai mục trùng lặp."
              );
            } else {
              console.log("Just Read đã thêm mục tự chạy.");
            }
          }
        );
      } else {
        console.error(
          "Mục này đã tồn tại trong danh sách tự chạy của Just Read. Không thêm mục mới."
        );
      }
    } else {
      chrome.storage.sync.set({ "auto-enable-site-list": [entry] });
    }
  });
}

let pageCMId, linkCMId, newTabCMId, autorunCMId;
function updateCMs() {
  chrome.storage.sync.get(
    ["enable-pageCM", "enable-linkCM", "enable-autorunCM", "enable-newTabCM"],
    function (result) {
      let size = 0;

      for (let key in result) {
        size++;

        if (key === "enable-pageCM") {
          if (result[key]) {
            if (typeof pageCMId == "undefined") createPageCM();
          } else {
            if (typeof pageCMId != "undefined") {
              pageCMId = undefined;
            }
          }
        } else if (key === "enable-linkCM") {
          if (result[key]) {
            if (typeof linkCMId == "undefined") createLinkCM();
          } else {
            if (typeof linkCMId != "undefined") {
              linkCMId = undefined;
            }
          }
        } else if (key === "enable-newTabCM") {
          if (result[key]) {
            if (typeof newTabCMId == "undefined") createNewTabCM();
          } else {
            if (typeof newTabCMId != "undefined") {
              newTabCMId = undefined;
            }
          }
        } else if (key === "enable-autorunCM") {
          if (result[key]) {
            if (typeof autorunCMId == "undefined") createAutorunCM();
          } else {
            if (typeof autorunCMId != "undefined") {
              autorunCMId = undefined;
            }
          }
        }
      }

      if (size === 0) {
        createPageCM();
        createLinkCM();
        createNewTabCM();
        createAutorunCM();
      }
    }
  );
}

// Listen for the extension's click
chrome.action.onClicked.addListener(startJustRead);

// Listen for the keyboard shortcut
chrome.commands.onCommand.addListener(function (command) {
  if (command == "open-just-read") startJustRead();
  if (command == "select-text") startSelectText();
  if (command == "new-tab-with-extensions") openNewTabWithExtensions();
});

// Listen for messages
let lastClosed = Date.now();
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "Open options") {
    chrome.runtime.openOptionsPage();
  } else if (request.updateCMs === "true") {
    updateCMs();
  } else if (request.closeTab === "true") {
    chrome.tabs.query(
      {
        active: true,
        lastFocusedWindow: true,
      },
      function (tabs) {
        const tab = tabs[0];
        setTimeout(function () {
          chrome.tabs.remove(tab.id);
        }, 100);
      }
    );
  } else if (request.lastClosed) {
    lastClosed = request.lastClosed;
  } else if (request.openNewTab) {
    openNewTabWithExtensions();
  }
  // For JRP
  else if (request.jrSecret) {
    chrome.storage.sync.set({ jrSecret: request.jrSecret });
  } else if (request.resetJRLastChecked) {
    chrome.storage.sync.set({ jrLastChecked: "" });
  } else if (request.tabOpenedJR) {
    const tabURL = request.tabOpenedJR.href.split("?")[0];
    for (const tabId in preventInstance) {
      chrome.tabs.get(parseInt(tabId), (tab) => {
        if (tab.url.split("?")[0] === tabURL) {
          setTimeout(() => delete preventInstance[tabId], 1000);
        }
      });
    }
  }
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "selectContentCM") {
    startSelectText();
  } else if (info.menuItemId === "pageCM") {
    startJustRead();
  } else if (info.menuItemId === "linkCM") {
    chrome.tabs.create({ url: info.linkUrl, active: false }, function (newTab) {
      chrome.storage.sync.set({ runOnLoad: true });
      startJustRead(newTab);
    });
  } else if (info.menuItemId === "newTabCM") {
    openNewTabWithExtensions();
  } else if (info.menuItemId === "autorunCM") {
    addSiteToAutorunList(info, tab);
  }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (preventInstance[tabId]) return;
  const change = Date.now() - lastClosed;
  if (changeInfo.status === "complete" && change > 300) {
    // Auto enable on sites specified
    chrome.storage.sync.get("auto-enable-site-list", function (siteListObj) {
      let siteList;
      if (siteListObj) {
        siteList = siteListObj["auto-enable-site-list"];
        const url = tab.url;

        if (typeof siteList !== "undefined") {
          for (let i = 0; i < siteList.length; i++) {
            // Allows the format `text.npr.org>5000` to autorun JR after 5 seconds on text.npr.org
            const entry = siteList[i];
            const splitEntry = entry.split(">");
            const entryRegex = splitEntry[0];
            const urlRegex = new RegExp(entryRegex, "i");

            if (url.match(urlRegex)) {
              chrome.storage.sync.set({ runOnLoad: true });
              startJustRead(tab);
              return;
            }
          }
        }

        // Check if jr=on is set, autorun if so
        if (new URL(url).searchParams.get("jr") === "on") {
          startJustRead(tab);
        }
      }
    });
  }
});

// Add our context menus
chrome.contextMenus.removeAll(function () {
  chrome.contextMenus.create(
    {
      title: "Chọn nội dung để đọc",
      contexts: ["action"],
      id: "selectContentCM",
    },
    chrome.runtime.lastError
  );
  updateCMs();
});