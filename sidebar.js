// 获取所有书签
function getBookmarks() {
  chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
    let parentElement = document.getElementById("bookmarkContainer");
    let urlCount = countUrls(bookmarkTreeNodes); // 统计书签数量
    document.getElementById("bookmarkCount").textContent = urlCount; // 显示书签数量
    displayBookmarks(bookmarkTreeNodes, parentElement, true); // 从第一个子节点开始显示书签
    console.log(bookmarkTreeNodes);
  });
}

// 统计书签数量
function countUrls(bookmarkNodes) {
  let count = 0;
  bookmarkNodes.forEach(function (bookmarkNode) {
    if (bookmarkNode.url) {
      count++;
    }
    if (bookmarkNode.children) {
      count += countUrls(bookmarkNode.children);
    }
  });
  return count;
}

// 显示书签
function displayBookmarks(bookmarkNodes, parentElement, isVisible = true) {
  let ul = document.createElement("ul");
  ul.classList.add("bookmark-list");
  ul.style.display = isVisible ? "block" : "none"; // 设置初始显示状态
  parentElement.appendChild(ul);

  bookmarkNodes.forEach(function (bookmarkNode) {
    let li = document.createElement("li");
    li.classList.add("bookmark-item"); // 添加类名
    ul.appendChild(li);

    let a = document.createElement("a");
    a.textContent = bookmarkNode.title;

    if (bookmarkNode.url) {
      // 如果是书签链接
      a.href = bookmarkNode.url;
      a.target = "_blank"; // 在新标签页打开
      let icon = document.createElement("img");
      icon.src = `chrome-extension://${
        chrome.runtime.id
      }/_favicon?pageUrl=${encodeURIComponent(bookmarkNode.url)}&size=32`;
      icon.classList.add("bookmark-icon"); // 添加类名
      a.insertBefore(icon, a.firstChild);
    } else {
      // 如果是文件夹
      a.href = "#";
      a.addEventListener("click", function (event) {
        event.preventDefault();
        toggleChildren(li);
      });
      let folderIcon = document.createElement("img");
      folderIcon.src = "images/icon-48.png";
      folderIcon.classList.add("folder-icon"); // 添加类名
      a.insertBefore(folderIcon, a.firstChild);
    }

    // 添加编辑和置顶按钮
    let actionButtons = document.createElement("div");
    actionButtons.classList.add("action-buttons");
    actionButtons.style.display = "none"; // 默认隐藏

    let editButton = document.createElement("button");
    editButton.textContent = "编辑";
    editButton.addEventListener("click", function (event) {
      event.preventDefault(); // 阻止默认行为
      event.stopPropagation(); // 阻止事件冒泡
      editBookmark(bookmarkNode);
    });

    let pinButton = document.createElement("button");
    pinButton.textContent = "置顶";
    pinButton.addEventListener("click", function (event) {
      event.preventDefault(); // 阻止默认行为
      event.stopPropagation(); // 阻止事件冒泡
      pinBookmark(bookmarkNode);
    });

    let deleteButton = document.createElement("button");
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", function (event) {
      event.preventDefault(); // 阻止默认行为
      event.stopPropagation(); // 阻止事件冒泡
      removeBookmark(bookmarkNode); // 调用删除书签的函数
    });

    actionButtons.appendChild(editButton);
    actionButtons.appendChild(deleteButton);
    actionButtons.appendChild(pinButton);
    a.appendChild(actionButtons);

    li.appendChild(a);

    if (bookmarkNode.children) {
      let initialVisibility = loadVisibilityState(li); // 加载显示状态
      displayBookmarks(
        bookmarkNode.children,
        li,
        initialVisibility === "block"
      ); // 传递显示状态
    }

    // 鼠标悬停时显示按钮
    a.addEventListener("mouseover", function () {
      actionButtons.style.display = "block";
    });

    // 鼠标移出时隐藏按钮
    a.addEventListener("mouseout", function () {
      actionButtons.style.display = "none";
    });
  });
}

// 编辑书签
function editBookmark(bookmarkNode) {
  let newTitle = prompt("请输入新的书签名称", bookmarkNode.title);
  if (newTitle) {
    chrome.bookmarks.update(bookmarkNode.id, { title: newTitle }, function () {
      bookmarkNode.title = newTitle;
      location.reload(); // 刷新页面以显示更新
    });
  }
}

// 删除书签
function removeBookmark(bookmarkNode) {
  if (confirm("确定要删除这个书签吗？")) {
    chrome.bookmarks.remove(bookmarkNode.id, function () {
      location.reload(); // 刷新页面以显示更新
    });
  }
}

// 添加置顶书签
function pinBookmark(bookmarkNode) {
  let collectBookmark = document.getElementById("collectBookmark");
  let pinnedItems = collectBookmark.querySelectorAll("a");
  if (pinnedItems.length >= 6) {
    collectBookmark.removeChild(pinnedItems[pinnedItems.length - 1]); // 删除最后一个书签
  }
  let pinnedItem = document.createElement("a");
  pinnedItem.href = bookmarkNode.url;
  pinnedItem.target = "_blank";
  pinnedItem.textContent = bookmarkNode.title;
  pinnedItem.classList.add("pinned-item"); // 添加类名

  // 添加书签图标
  let icon = document.createElement("img");
  icon.src = `chrome-extension://${
    chrome.runtime.id
  }/_favicon?pageUrl=${encodeURIComponent(bookmarkNode.url)}&size=32`;
  icon.classList.add("pinned-icon"); // 添加类名
  pinnedItem.insertBefore(icon, pinnedItem.firstChild);

  // // 添加删除按钮
  // let topDeleteButton = document.createElement("button");
  // topDeleteButton.textContent = "X";
  // topDeleteButton.classList.add("delete-button"); // 添加类名
  // topDeleteButton.style.display = "block"; // 默认隐藏删除按钮
  // topDeleteButton.addEventListener("click", function (event) {
  //   event.preventDefault(); // 阻止默认行为
  //   event.stopPropagation(); // 阻止事件冒泡
  //   removePinnedBookmark(pinnedItem); // 调用删除置顶书签的函数
  // });
  // pinnedItem.appendChild(topDeleteButton);

  // // 鼠标滑过时显示删除按钮
  // pinnedItem.addEventListener("mouseover", function () {
  //   topDeleteButton.style.display = "block";
  // });

  // // 鼠标移出时隐藏删除按钮
  // pinnedItem.addEventListener("mouseout", function () {
  //   topDeleteButton.style.display = "none";
  // });

  collectBookmark.insertBefore(pinnedItem, collectBookmark.firstChild); // 插入到第一个位置

  savePinnedBookmarks(); // 保存置顶书签到本地

  // 确保图片加载完成后再获取颜色
  icon.onload = () => {
    getImageColor(icon, (color) => {
      const rgbaColor = convertToRGBA(color, 0.4); // 转换为RGBA格式并设置60%透明度
      pinnedItem.style.backgroundColor = rgbaColor;
    });
  };

  // 如果图片加载失败，使用默认颜色
  icon.onerror = () => {
    const defaultColor = "rgba(245, 245, 245, 0.4)";
    pinnedItem.style.backgroundColor = defaultColor;
  };
}

// // 删除置顶书签
// function removePinnedBookmark(pinnedItem) {
//   let collectBookmark = document.getElementById("collectBookmark");
//   if (collectBookmark && pinnedItem.parentNode === collectBookmark) {
//     collectBookmark.removeChild(pinnedItem); // 从DOM中移除置顶书签
//     savePinnedBookmarks(); // 保存更新后的置顶书签列表
//   }
// }

// 获取图标颜色
function getImageColor(img, callback) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const width = img.width;
  const height = img.height;
  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height).data;

  const colorCounts = {};
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];

    // 忽略透明度较低的像素
    if (a < 125) continue;

    const color = `rgb(${r}, ${g}, ${b})`;
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  }

  // 提供初始值以避免空数组错误
  const dominantColor = Object.keys(colorCounts).reduce(
    (a, b) => (colorCounts[a] > colorCounts[b] ? a : b),
    null
  );

  // 如果 dominantColor 为 null，则使用默认颜色
  const defaultColor = "rgb(245, 245, 245)";
  callback(dominantColor || defaultColor);
}

// 将RGB颜色转换为RGBA格式并设置透明度
function convertToRGBA(rgb, alpha) {
  const [r, g, b] = rgb.match(/\d+/g).map(Number);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 保存置顶书签到本地
function savePinnedBookmarks() {
  let collectBookmark = document.getElementById("collectBookmark");
  let pinnedItems = collectBookmark.querySelectorAll("a");
  let pinnedBookmarks = Array.from(pinnedItems).map((item) => ({
    url: item.href,
    title: item.textContent,
    color: item.style.backgroundColor, // 保存颜色
  }));
  localStorage.setItem("pinnedBookmarks", JSON.stringify(pinnedBookmarks));
}

// 加载置顶书签
function loadPinnedBookmarks() {
  let collectBookmark = document.getElementById("collectBookmark");
  let pinnedBookmarks =
    JSON.parse(localStorage.getItem("pinnedBookmarks")) || [];
  pinnedBookmarks.forEach((bookmark) => {
    let pinnedItem = document.createElement("a");
    pinnedItem.href = bookmark.url;
    pinnedItem.target = "_blank";
    pinnedItem.textContent = bookmark.title;
    pinnedItem.classList.add("pinned-item"); // 添加类名
    pinnedItem.style.backgroundColor = bookmark.color; // 设置颜色

    // 添加书签图标
    let icon = document.createElement("img");
    icon.src = `chrome-extension://${
      chrome.runtime.id
    }/_favicon?pageUrl=${encodeURIComponent(bookmark.url)}&size=32`;
    icon.classList.add("pinned-icon"); // 添加类名
    pinnedItem.insertBefore(icon, pinnedItem.firstChild);

    collectBookmark.appendChild(pinnedItem);
  });
}

// 切换子书签的显示和隐藏
function toggleChildren(parentElement) {
  let children = parentElement.querySelector("ul");
  if (children) {
    children.style.display =
      children.style.display === "none" ? "block" : "none";
    saveVisibilityState(parentElement, children.style.display); // 保存显示状态
  }
}

// 保存显示状态
function saveVisibilityState(parentElement, displayState) {
  let key = `bookmark_${parentElement.querySelector("a").textContent}`;
  localStorage.setItem(key, displayState);
}

// 加载显示状态
function loadVisibilityState(parentElement) {
  let key = `bookmark_${parentElement.querySelector("a").textContent}`;
  return localStorage.getItem(key) || "block";
}

// 切换所有书签的显示和隐藏
function toggleAllBookmarks(show) {
  let bookmarkList = document.querySelectorAll(".bookmark-list");
  bookmarkList.forEach(function (list) {
    list.style.display = show ? "block" : "none";
  });
}

// 初始化
document.addEventListener("DOMContentLoaded", function () {
  getBookmarks();
  loadPinnedBookmarks(); // 加载置顶书签

  // 添加点击事件监听器
  document
    .getElementById("showBookmark")
    .addEventListener("click", function () {
      let bookmarkList = document.querySelectorAll(".bookmark-list");
      let show = bookmarkList[0].style.display === "none";
      toggleAllBookmarks(show);
    });
});
