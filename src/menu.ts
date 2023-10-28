import { AppUserConfigs, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import { openPageFromPageName } from './lib'
import { t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
import { format, parse } from 'date-fns'
let flagNamespace: boolean = false // ページ名に階層が含まれる場合のフラグ

// ツールバーからPARAメニューを開く
export const openMenuFromToolbar = async () => {
  let template = "" // テンプレート(HTML)用
  let title = "" // タイトル用
  let namespace = "" // namespace用
  // 現在のページを取得
  const getPage = await logseq.Editor.getCurrentPage() as PageEntity | null
  if (getPage) {

    // ページが存在する場合
    title = getPage.originalName
    // PARAページに該当する場合のフラグ
    const flagPARA = title === "Projects"
      || title === "Areas of responsibility"
      || title === "Resources"
      || title === "Archives"
      || title === logseq.settings!.inboxName
      ? true : false
    // タグボタンの表示は、Journalページではなく、paraページでもない場合のみ
    const flagTagButton: boolean = getPage['journal?'] === false && flagPARA === false

    // ページ名に階層が含まれる場合は、階層を削除したページ名を表示する
    let printNamespace = ""
    flagNamespace = title.includes("/") as boolean

    namespace = flagNamespace ?
      title.split("/").slice(-1)[0] //階層が含まれる場合
      : title //階層が含まれない場合
    const printCopyButton = `<button data-on-click="copyPageTitleLink" title="${t("Copy current full page name to clipboard")}">📋</button>`
    if (flagNamespace) {
      const pageCheck = await logseq.Editor.getPage(namespace) as PageEntity | null
      //ページ名を省略する
      const titleString = namespace.length > 28 ? `${namespace.slice(0, 28)}...` : namespace
      printNamespace = `<li class="para-away"><label title="<Namespace> ${t("Open the list")}"><span style="font-size:.88em">📇 ${titleString}<input id="paraCheckboxNamespace" type="checkbox"/><div id="paraTooltipNamespace" data-namespace="${namespace}"></div></span></label><span>${//ページが存在する場合とそうでない場合
        pageCheck ?
          // ページが存在する場合
          //タグ、開くボタンを表示する
          `${printCopyButton}|<button data-on-click="namespaceNewPage" data-namespace="${namespace}" data-old="${title}" title="${t("Tag")} '${namespace}'">🏷️</button>|<button id="paraOpenButtonNamespace" title="${t("Press Shift key at the same time to open in sidebar")}" data-namespace="${namespace}">📄</button></span></li>`
          :
          //  ページが存在しない場合
          //タグ、開くボタンを表示しない
          `<button data-on-click="namespaceNewPage" data-namespace="${namespace}" data-old="${title}" title="${t("New page using the sub page name (namespace)")}\n'${namespace}'">🆕</button>|${printCopyButton}</span></li>`
        }`
    } else {
      // 階層が含まれない場合
      //タグ、開くボタンを表示しない
      printNamespace = `<li class="para-away"><label title="${t("Open the list")}"><span style="font-size:.88em">📇 ${namespace}<input id="paraCheckboxNamespace" type="checkbox"/><div id="paraTooltipNamespace" data-namespace="${namespace}"></div></span></label><span>${printCopyButton}</span></li>`
    }
    template = `
  <div style="user-select: none" title="">
    <ul>
      <li class="para-away"><label title="${t("Open the list")}"><span>📧 ${t("Inbox")}<input id="paraCheckboxInbox" type="checkbox"/><div id="paraTooltipInbox"></div></span></label><span>${title === logseq.settings!.inboxName ? "" : `<button data-on-click="Inbox" title="${t("Put current page in inbox")}">📦</button>|`}<button id="paraOpenButtonInbox" title="${t("Press Shift key at the same time to open in sidebar")}">📄</button></span></li>
      <li style="margin-top:.6em" class="para-away">${createPickListSelect(flagTagButton)}</li>
      ${title === logseq.settings!.inboxName ? "" : printNamespace}
      <hr/>
      <li class="para-away"><label title="${t("Open the list")}"><span>✈️ [Projects]<input id="paraCheckboxP" type="checkbox"/><div id="paraTooltipP"></div></span></label><span>${flagTagButton ? `<button title="${t("Tag the current page (Page-tag)")}" data-on-click="Projects">🏷️</button>|` : ''}<button id="paraOpenButtonProjects" title="${t("Press Shift key at the same time to open in sidebar")}">📄</button></span></li>
      <li class="para-away"><label title="${t("Open the list")}"><span>🏠 [Areas of responsibility]<input id="paraCheckboxAreas" type="checkbox"/><div id="paraTooltipAreas"></div></span></label><span>${flagTagButton ? `<button title="${t("Tag the current page (Page-tag)")}" data-on-click="AreasOfResponsibility">🏷️</button>|` : ''}<button id="paraOpenButtonAreas" title="${t("Press Shift key at the same time to open in sidebar")}">📄</button></span></li>
      <li class="para-away"><label title="${t("Open the list")}"><span>🌍 [Resources]<input id="paraCheckboxR" type="checkbox"/><div id="paraTooltipR"></div></span></label><span>${flagTagButton ? `<button title="${t("Tag the current page (Page-tag)")}" data-on-click="Resources">🏷️</button>|` : ''}<button id="paraOpenButtonResources" title="${t("Press Shift key at the same time to open in sidebar")}">📄</button></span></li>
      <li class="para-away"><label title="${t("Open the list")}"><span>🧹 [Archives]<input id="paraCheckboxA" type="checkbox"/><div id="paraTooltipA"></div></span></label><span>${flagTagButton ? `<button title="${t("Tag the current page (Page-tag)")}" data-on-click="Archives">🏷️</button>|` : ''}<button id="paraOpenButtonArchives" title="${t("Press Shift key at the same time to open in sidebar")}">📄</button></span></li>
    </ul>
    <hr/>
      `
  } else {

    // ページが存在しない場合
    title = "⚓"
    template = `
    <div title="" style="user-select: none" title="">
    <ul>
      ${title === logseq.settings!.inboxName ? "" : `<li class="para-away"><label title="${t("Open the list")}"><span>📧 ${t("Inbox")}<input id="paraCheckboxInbox" type="checkbox"/><div id="paraTooltipInbox"></div></span></label><span><button id="paraOpenButtonInbox" title="${t("Press Shift key at the same time to open in sidebar")}">📄</button></span></li>`}
      <li style="margin-top:.6em" class="para-away">${createPickListSelect(false)}</li>
      <hr/>
      <li class="para-away"><label title="${t("Open the list")}"><span>/✈️ [Projects]<input id="paraCheckboxP" type="checkbox"/><div id="paraTooltipP"></div></span></label><span><button id="paraOpenButtonProjects" title="${t("Press Shift key at the same time to open in sidebar")}">📄</button></span></li>
      <li class="para-away"><label title="${t("Open the list")}"><span>/🏠 [Areas of responsibility]<input id="paraCheckboxAreas" type="checkbox"/><div id="paraTooltipAreas"></div></span></label><span><button id="paraOpenButtonAreas" title="${t("Press Shift key at the same time to open in sidebar")}">📄</button></span></li>
      <li class="para-away"><label title="${t("Open the list")}"><span>/🌍 [Resources]<input id="paraCheckboxR" type="checkbox"/><div id="paraTooltipR"></div></span></label><span><button id="paraOpenButtonResources" title="${t("Press Shift key at the same time to open in sidebar")}">📄</button></span></li>
      <li class="para-away"><label title="${t("Open the list")}"><span>/🧹 [Archives]<input id="paraCheckboxA" type="checkbox"/><div id="paraTooltipA"></div></span></label><span><button id="paraOpenButtonArchives" title="${t("Press Shift key at the same time to open in sidebar")}">📄</button></span></li>
    </ul>
    <hr/>
    `
  }

  template += `
  <ul title="">
  <h2>${t("Combination Menu")}</h2>
  <h3><u>${t("New page")}</u> +</h3>
  <li><button data-on-click="NewPageInbox">📧 ${t("Into [Inbox]")}</button></li>
  <li><button data-on-click="NewProject">✈️ ${t("Page-Tag")} [Projects]</button></li> 
  </ul>
  <hr/>
  <p title=""><small>⚓ ${t("Quickly PARA method Plugin")}</small> | <a data-on-click="PARAsettingButton" title="${t("Plugin Settings")}">⚙️</a> | <small><a href="https://github.com/YU000jp/logseq-plugin-quickly-para-method" title="(Github link)" target="_blank">GitHub</a></small></p>
  </div>
  `

  logseq.provideUI({
    key: "openQuickly",
    attrs: {
      title,
    },
    reset: true,
    close: "outside",
    template,
    style: {
      width: "400px",
      maxHeight: "980px",
      left: "unset",
      bottom: "unset",
      right: "1em",
      top: "4em",
      paddingLeft: "1em",
      paddingTop: "0.7em",
      backgroundColor: 'var(--ls-primary-background-color)',
      color: 'var(--ls-primary-text-color)',
      boxShadow: '1px 2px 5px var(--ls-secondary-background-color)',
    },
  })

  // ボタン操作 (Shiftキーに対応させるため)
  setTimeout(() => eventListener({ namespace }), 100)

}


// イベントリスナー
const eventListener = (get: { namespace: string }) => {
  // それぞれの開くボタン
  if (flagNamespace) openPageButton("paraOpenButtonNamespace", get.namespace) // namespaceの場合は、data-namespaceの値を取得
  openPageButton("pickListOpenButton", "pickListSelect", { pickListSelect: true }) //selectの値を取得 (別の場所に書くと、selectの値が取得できない)
  openPageButton("paraOpenButtonInbox", logseq.settings!.inboxName) //Inbox
  openPageButton("paraOpenButtonProjects", "Projects")
  openPageButton("paraOpenButtonAreas", "Areas of responsibility")
  openPageButton("paraOpenButtonResources", "Resources")
  openPageButton("paraOpenButtonArchives", "Archives")
  // ツールチップ
  tooltip("📧", "paraCheckboxInbox", "paraTooltipInbox", logseq.settings!.inboxName, { inbox: true })
  tooltip("📇", "paraCheckboxNamespace", "paraTooltipNamespace", get.namespace, { namespace: true })
  tooltip("✈️", "paraCheckboxP", "paraTooltipP", "Projects")
  tooltip("🏠", "paraCheckboxAreas", "paraTooltipAreas", "Areas of responsibility")
  tooltip("🌍", "paraCheckboxR", "paraTooltipR", "Resources")
  tooltip("🧹", "paraCheckboxA", "paraTooltipA", "Archives")
}

const openPageButton = (
  elementId: string,
  pageName: string,
  flag?: {
    pickListSelect?: boolean,
  }) => {
  // namespaceやpickListSelectの場合は、個別に値を取得する

  if (!pageName) return
  const button = parent.document.getElementById(elementId) as HTMLButtonElement | null
  if (button) {
    button.addEventListener("click", async ({ shiftKey }) => {

      if (flag && flag.pickListSelect === true) {
        // ピックリストの場合は、selectの値を取得
        const selectValue = (parent.document.getElementById('pickListSelect') as HTMLSelectElement)!.value
        if (selectValue !== "") openPageFromPageName(selectValue, shiftKey)
      } else
        // ピックリスト以外の場合は、pageNameをそのまま渡す
        if (pageName !== "") openPageFromPageName(pageName, shiftKey)

    })
  }
}


// ツールチップ
const tooltip = (
  titleIcon: string,
  checkboxEleId: string,
  tooltipEleId: string,
  pageName: string,
  flag?: {
    namespace?: boolean,
    inbox?: boolean
  }) => {


  const showList = tooltipCreateList(titleIcon, pageName, flag)



  const tooltipCheckbox = parent.document.getElementById(checkboxEleId) as HTMLInputElement | null
  if (tooltipCheckbox) {
    tooltipCheckbox.addEventListener("change", async () => {
      const tooltip = parent.document.getElementById(tooltipEleId) as HTMLDivElement | null
      if (!tooltip) return
      if (tooltipCheckbox.checked) {
        // labelタグ連携で、チェックボックスがチェックされたら、ツールチップを表示
        tooltip.innerHTML = t("Loading...")
        tooltip.title = ""
        showList(tooltip)
      }
    })
  }
}


// ピックリストの行を作成
const createPickListSelect = (isPage: boolean): string => {
  const pickList = logseq.settings?.pickList?.split("\n") ?? []
  let select = ""
  if (pickList.length === 0) {
    select = `<small>${t("Please set the pick list in the plugin settings.")}</small>`
  } else {
    select = `
      <span>
        <select id="pickListSelect" title="${t("Pick List")}">
          <option value="">${t("🗒️ Pick List")}</option>
          ${pickList.map((item) => {
      const label = item.length > 14 ? `${item.slice(0, 14)}...` : item
      return `<option value="${item}">${label}</option>`
    }).join("")}
        </select>
      </span>
      <span>
        ${isPage ? `<button title="${t("Tag the current page (Page-tag)")}" data-on-click="pickListTagSubmitButton">🏷️</button>|` : ""}<button id="pickListOpenButton" title="${t("Press Shift key at the same time to open in sidebar")}">📄</button>
      </span>
    `
  }
  return select
}


const tooltipCreateList = (
  titleIcon: string,
  pageName: string,
  flag?: {
    namespace?: boolean,
    inbox?: boolean
  }) => {
  return async (tooltip: HTMLDivElement) => {
    // チェックボックスがチェックされたら、ツールチップを表示
    //h2
    const eleH2 = document.createElement("h2") as HTMLHeadingElement
    eleH2.innerHTML = `${titleIcon} ${pageName} ${flag && flag.inbox ? "" : `<small>${t("List")}</small>`}`
    //div
    const eleDiv = document.createElement("div") as HTMLDivElement


    if (flag && flag.namespace === true) {
      //namespaceの場合

      //data - namespaceの値を取得
      const namespace = pageName
      if (!namespace) return logseq.UI.showMsg("Cannot get the page name", "warning")


      //logseq.UI.showMsg(namespace, "info")

      const queryPageName = namespace.toLowerCase() // クエリーでは、ページ名を小文字にする必要がある

      //同じ名前をもつページ名を取得するクエリー
      const query = `
      [:find (pull ?p [:block/original-name])
              :in $ ?pattern
              :where
              [?p :block/name ?c]
              [(re-pattern ?pattern) ?q]
              [(re-find ?q ?c)]
      ]
      `
      let result = (await logseq.DB.datascriptQuery(query, `"${queryPageName}"`) as any | null)?.flat() as {
        "original-name": string
      }[] | null
      if (!result) return logseq.UI.showMsg("Cannot get the page name", "error")

      //resultの中に、nullが含まれている場合があるので、nullを除外する
      result = result.filter((item) => item !== null)


      if (result.length === 0) {
        //このページ名に関連するページは見つかりませんでした。
        eleDiv.innerHTML = t("No pages found for this page name.")
        return tooltip.append(eleH2, eleDiv)
      }

      // ページ名を、名称順に並び替える
      result = result.sort((a, b) => {
        return a["original-name"] > b["original-name"] ? 1 : -1
      })

      //h2
      eleH2.innerText = `${titleIcon} ${namespace} ${t("List")}`
      // ページ名を表示する
      const eleUl = document.createElement("ul") as HTMLUListElement
      for (const page of result) {
        const pageName = page['original-name']
        const eleLi = document.createElement("li") as HTMLLIElement
        const pageNameString = pageName.length > 32 ? `${pageName.slice(0, 32)}...` : pageName
        const aEle = document.createElement("a") as HTMLAnchorElement
        aEle.dataset.pageName = pageName
        aEle.title = pageName
        aEle.innerText = pageNameString
        aEle.id = `para-tooltip-namespace--${pageName}`
        eleLi.append(aEle)
        eleUl.append(eleLi)
        setTimeout(() => {
          parent.document.getElementById(aEle.id)?.addEventListener("click", function (this, { shiftKey }) {
            openPageFromPageName(this.dataset.pageName as string, shiftKey)
          })
        }, 100)
      }
      eleDiv.append(eleUl)

      //hr
      eleDiv.innerHTML += "<hr/>"
      // 「ページ名に同じ名称を含んでいるページを一覧表示します」という内容でメッセージを表示する
      eleDiv.innerHTML += `<p><small>${t("Pages that contain the same name as the page name are displayed.")}</small></p>`


      //end of namespace
    } else if (flag && flag.inbox === true) {
      //inboxの場合

      eleH2.title = t("Pages in the inbox")
      const blocksEntity = await logseq.Editor.getPageBlocksTree(logseq.settings!.inboxName) as BlockEntity[] | null
      if (!blocksEntity) return logseq.UI.showMsg("Cannot get the page name", "warning")
      const firstBlock = blocksEntity[0]
      //一行目のサブブロックを取得
      let subBlocks = firstBlock.children as BlockEntity[] | null
      // contentが""を除外する
      if (subBlocks) subBlocks = subBlocks.filter((item) => item['content'] !== "")
      if (!subBlocks) {
        //inboxのサブブロックがない場合
        eleDiv.innerHTML = t("No pages found for this inbox.")
        return tooltip.append(eleH2, eleDiv)
      } else {
        //inboxのサブブロックがある場合

        //サブブロックの中にある、すべてのサブブロック(children)を取得する
        let subSubBlocks = subBlocks.map((item) => item.children).flat() as BlockEntity[] | null
        // contentが""を除外する
        if (subSubBlocks) subSubBlocks = subSubBlocks.filter((item) => item['content'] !== "")

        if (subSubBlocks && subSubBlocks.length > 0) {
          //サブサブブロックがある場合
          //サブブロックは[[YYYY/MM]]のような形式で月ごとの分類になっている
          //サブサブブロックは「[[日付形式]] [[ページ名]]」という形式になっている
          //月の分類ごとにグループ化する
          const pagesByMonth: {
            [key: string]: {
              "original-name": string
              "receive-date": Date
            }[]
          } = {}
          for (const subSubBlock of subSubBlocks) {
            //contentに含まれる日付を取得
            let monthString = subSubBlock['content'].split("]] ")[0] as string | undefined
            if (!monthString) continue

            const { preferredDateFormat } = await logseq.App.getUserConfigs() as AppUserConfigs
            const day: Date = parse(monthString.replace("[[", ""),  // [[を削除する
              preferredDateFormat, new Date())// ユーザー日付形式から、YYYY/MMのような形式で作成する
            // 正しい日付形式でない場合は、スキップする
            if (day.toString() === "Invalid Date") continue
            const monthKey = format(day, "yyyy/MM")
            //月ごとにグループ化する
            if (!pagesByMonth[monthKey]) {
              pagesByMonth[monthKey] = []
            }

            //ページ名を取得する
            let pageName = subSubBlock['content'].split("]] ")[1] as string | undefined
            if (!pageName) continue
            // [[ページ名]]で囲まれているので、ページ名を取得する
            pageName = pageName.match(/\[\[(.+)\]\]/)?.[1] as string | undefined
            if (!pageName) continue

            //original-nameを追加
            pagesByMonth[monthKey].push({
              "original-name": pageName as string,
              "receive-date": day as Date
            })

            //day(Date)でソートする
            pagesByMonth[monthKey].sort((a, b) => {
              return a["receive-date"] > b["receive-date"] ? -1 : 1
            })

            //月ごとにページ名を表示する
            for (const monthKey in pagesByMonth) {
              const pages = pagesByMonth[monthKey]
              //年月を取得
              const month = new Date(monthKey).toLocaleDateString("default", { year: "numeric", month: "long" })
              // 更新月
              eleDiv.innerHTML += `<h3>${month} <small>(${t("Received month")})</small></h3>`
              const eleUl = document.createElement("ul") as HTMLUListElement
              for (const page of pages) {
                const pageName = page['original-name']
                const eleLi = document.createElement("li") as HTMLLIElement
                const pageNameString = pageName.length > 32 ? `${pageName.slice(0, 32)}...` : pageName
                const receiveDate: Date | null = page["receive-date"]
                // 正しい日付形式でない場合は、スキップする
                if (receiveDate.toString() === "Invalid Date") continue
                const receiveString = receiveDate.toLocaleDateString("default", { year: "numeric", month: "short", day: "numeric" })
                //eleLi.innerHTML = `<a data-page-name="${pageName}" title="${pageName}\n\n${t("Received at")}: ${receiveString}">${pageNameString}</a>`
                const aEle = document.createElement("a") as HTMLAnchorElement
                aEle.dataset.pageName = pageName
                aEle.title = `${pageName}\n\n${t("Received at")}: ${receiveString}`
                aEle.innerText = pageNameString
                aEle.id = `para-tooltip-inbox-m--${pageName}`
                eleLi.append(aEle)
                eleUl.append(eleLi)
                setTimeout(() => {
                  parent.document.getElementById(aEle.id)?.addEventListener("click", function (this, { shiftKey }) {
                    openPageFromPageName(this.dataset.pageName as string, shiftKey)
                  })
                }, 100)
              }
              eleDiv.append(eleUl)
              //hr
              eleDiv.innerHTML += "<hr/>"
            }

            //end of 月ごとにページ名を表示する
          }

        }//end of サブサブブロックがある場合


        // 月ごとのソートがオフで、混合している場合も処理する
        // contentに、先頭が「[[」で始まる場合は、サブブロックとして処理する
        const subBlocksNotSortByMonth = subBlocks.filter((item) =>
          item['content'].startsWith("[[")
        )
        if (subBlocksNotSortByMonth && subBlocksNotSortByMonth.length > 0) {

          //サブブロックを表示する
          const eleUl = document.createElement("ul") as HTMLUListElement
          for (const subBlock of subBlocksNotSortByMonth) {
            // contentに含まれるページ名を取得
            // [[日付フォーマット]] [[ページ名]] という形式になっているので、2つ目を取得する
            let pageName = subBlock['content'].split(" [[")[1] as string | undefined
            if (!pageName) continue
            // ]]を削除する
            pageName = pageName.replace("]]", "")
            if (!pageName) continue

            // 1つ目の[[日付フォーマット]]を取得する
            const { preferredDateFormat } = await logseq.App.getUserConfigs() as AppUserConfigs
            // [[を削除する
            const dateString = subBlock['content'].split("]] ")[0].replace("[[", "") as string | undefined
            if (!dateString) continue
            const day: Date = parse( // 日付を作成
              dateString,
              preferredDateFormat, new Date())// ユーザー日付形式から、YYYY/MMのような形式で作成する
            // 正しい日付形式でない場合は、スキップする
            if (day.toString() === "Invalid Date") continue

            //ページ名を表示する
            const eleLi = document.createElement("li") as HTMLLIElement
            const pageNameString = pageName.length > 32 ? `${pageName.slice(0, 32)}...` : pageName
            const dayString = day.toLocaleDateString("default", { year: "numeric", month: "short", day: "numeric" })
            const aEle = document.createElement("a") as HTMLAnchorElement
            aEle.dataset.pageName = pageName
            aEle.title = `${pageName}\n\n${t("Received at")}: ${dayString}`
            aEle.innerText = pageNameString
            aEle.id = `para-tooltip-inbox--${pageName}`
            eleLi.append(aEle)
            eleUl.append(eleLi)
            setTimeout(() => {
              parent.document.getElementById(aEle.id)?.addEventListener("click", function (this, { shiftKey }) {
                openPageFromPageName(this.dataset.pageName as string, shiftKey)
              })
            }, 100)
          }
          eleDiv.append(eleUl)
          //hr
          eleDiv.innerHTML += "<hr/>"

        }//end of サブブロックがある場合

        // 「そのInboxページの最初の行に含まれるサブブロックのリンクが表示されています」というメッセージをいれる
        eleDiv.innerHTML += `<p><small>${t("The links contained in the sub-blocks of the first line of that Inbox page are displayed.")}</small></p>`
      }//end of inboxのサブブロックがある場合

      //end of inbox
    } else {


      //ページタグを一覧表示する
      eleH2.title = t("Pages tagged with")
      const queryPageName = pageName.toLowerCase() // クエリーでは、ページ名を小文字にする必要がある

      //logseq.UI.showMsg(pageName, "info")


      // ページ名と更新日時を取得するクエリ
      const query = `
    [:find (pull ?p [:block/original-name :block/updated-at])
            :in $ ?name
            :where
            [?t :block/name ?name]
            [?p :block/tags ?t]]
    `
      let result = (await logseq.DB.datascriptQuery(query, `"${queryPageName}"`) as any | null)?.flat() as {
        "original-name": string
        "updated-at": string
      }[] | null
      if (!result) return logseq.UI.showMsg("Cannot get the page name", "warning")

      //resultの中に、nullが含まれている場合があるので、nullを除外する
      result = result.filter((item) => item !== null)

      if (result.length === 0) {
        //このページタグに一致するページは見つかりませんでした。
        eleDiv.innerHTML = t("No pages found for this page tag.")
      } else {

        // ページ名を、日付順に並び替える
        result = result.sort((a, b) => {
          return a["updated-at"] > b["updated-at"] ? -1 : 1
        })

        // 日付を月ごとにグループ化するためのオブジェクト
        const pagesByMonth: {
          [key: string]: {
            "original-name": string
            "updated-at": string
          }[]
        } = {}

        // ページ名を月ごとにグループ化する
        for (const page of result) {
          const updatedAt = new Date(page["updated-at"])
          const month = updatedAt.getMonth() + 1 // 月の値を取得
          const monthKey = `${updatedAt.getFullYear()}-${month.toString().padStart(2, "0")}` // キーを作成
          if (!pagesByMonth[monthKey]) {
            pagesByMonth[monthKey] = []
          }
          //original-nameだけでなくupdated-atを追加
          pagesByMonth[monthKey].push(page)
        }

        // 月ごとにページ名を表示する
        for (const monthKey in pagesByMonth) {
          const pages = pagesByMonth[monthKey]
          //年月を取得
          const month = new Date(monthKey).toLocaleDateString("default", { year: "numeric", month: "long" })
          // 更新月
          eleDiv.innerHTML += `<h3>${month} <small>(${t("Updated month")})</small></h3>`
          const eleUl = document.createElement("ul") as HTMLUListElement
          for (const page of pages) {
            const pageName = page['original-name']
            const eleLi = document.createElement("li") as HTMLLIElement
            const pageNameString = pageName.length > 32 ? `${pageName.slice(0, 32)}...` : pageName
            const createdString = new Date(page['updated-at']).toLocaleDateString("default", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "numeric" })
            const aEle = document.createElement("a") as HTMLAnchorElement
            aEle.dataset.pageName = pageName
            aEle.title = `${pageName}\n\n${t("Updated at")}: ${createdString}`
            aEle.innerText = pageNameString
            aEle.id = `para-tooltip-page-tag--${pageName}`
            eleLi.append(aEle)
            eleUl.append(eleLi)
            setTimeout(() => {
              parent.document.getElementById(aEle.id)?.addEventListener("click", function (this, { shiftKey }) {
                openPageFromPageName(this.dataset.pageName as string, shiftKey)
              })
            }, 100)
          }
          eleDiv.append(eleUl)
        }
        //hr
        eleDiv.innerHTML += "<hr/>"

        // 「そのページタグが付けられたページが一覧で表示されます。」というメッセージをいれる
        eleDiv.innerHTML += `<p><small>${t("Pages tagged with that page tag are displayed in a list.")}</small></p>`
      }
    } //end of namespace以外


    tooltip.innerHTML = "" // ツールチップを空にする
    tooltip.append(eleH2, eleDiv)
  }
}

