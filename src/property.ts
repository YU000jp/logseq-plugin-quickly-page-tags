import { AppUserConfigs, BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import { format } from 'date-fns'
import { t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
import { removePopup } from './lib'


/**
 * コマンドを実行する (チェックをおこなう)
 * @param addProperty 追加するプロパティ
 * @param addType 追加するプロパティのタイプ
 */
export const runCommand = async (addProperty: string, addType: string) => {

  // 追加するプロパティが空の場合はキャンセルとする
  if (addProperty === "") return logseq.UI.showMsg(t("Cancel"), "warning")

  // 現在のページを取得する
  const getCurrent = await logseq.Editor.getCurrentPage() as PageEntity | null
  if (getCurrent) {
    // 現在のページと同じ名前のプロパティを追加しようとした場合はキャンセルとする
    if (getCurrent.name === addProperty
      || getCurrent.originalName === addProperty)
      return logseq.UI.showMsg(t("No need to tag the current page."), "warning")

    // 現在のページのブロックツリーを取得する
    const getCurrentTree = await logseq.Editor.getCurrentPageBlocksTree() as BlockEntity[] | null
    if (getCurrentTree === null) return logseq.UI.showMsg(t("Failed (Can not get the current page)"), "warning")

    // ポップアップを削除
    removePopup()

    // ページにプロパティを追加する
    await updatePageProperty(addProperty, getCurrent, addType, getCurrentTree[0].uuid)

  }
}


/**
 * ページにプロパティを追加し、必要に応じて日付を記録する
 * @param addProperty 追加するプロパティ
 * @param getCurrent 現在のページ
 * @param addType 追加するプロパティのタイプ
 * @param uuid ページの最初のブロックのUUID
 */
export const updatePageProperty = async (addProperty: string, getCurrent: PageEntity, addType: string, uuid: string) => {

  const message = () => {
    if (addType === "INBOX") logseq.UI.showMsg(t("Into [Inbox]"), "success", { timeout: 3000 })
    else logseq.UI.showMsg(`${t("Page-Tag")} ${addProperty}`, "info", { timeout: 3000 })
  }

  // ページにプロパティを追加する
  //INBOX以外、またはタグをつける設定が有効の場合
  if (addType !== "INBOX") await updatePageProperties(addProperty, "tags", getCurrent.properties, addType, uuid)

  // ページに日付を記録する
  if ((addType !== "PARA" && logseq.settings?.switchRecodeDate === true) || (addType === "PARA" && logseq.settings?.switchPARArecodeDate === true)) {

    const { preferredDateFormat } = await logseq.App.getUserConfigs() as AppUserConfigs

    setTimeout(async () => {
      const success: boolean = await RecodeDateToPage(preferredDateFormat, addProperty, " [[" + getCurrent.originalName + "]]")
      if (success) message()
    }, 300)

  } else {
    // 成功した場合のメッセージを表示
    message()
  }

}

/**
 * 指定されたページに日付を記録する
 * @param userDateFormat ユーザーが設定した日付のフォーマット
 * @param targetPageName 日付を記録するページの名前
 * @param pushPageLink 日付を記録するページへのリンク
 */
export const RecodeDateToPage = async (userDateFormat, targetPageName, pushPageLink, flagRepeat?: boolean): Promise<boolean> => {
  const blocks = await logseq.Editor.getPageBlocksTree(targetPageName) as BlockEntity[]
  if (blocks.length > 0) {

    logseq.showMainUI() // 作業保護

    // 先頭行の下に追記する
    await logseq.Editor.insertBlock(blocks[0].uuid,
      logseq.settings!.archivesDone === true && targetPageName === "Archives" ? "DONE" : "" // Archivesページの場合はDONEを追加
        + " [[" + format(new Date(), userDateFormat) + "]]" + pushPageLink // 日付ページへのリンク
      , { sibling: false }) // ブロックのサブ行に追記

    logseq.hideMainUI() // 作業保護解除
    return true
  } else {
    if (flagRepeat) {
      logseq.UI.showMsg("Failed (Can not get the current page)", "warning") // 無限ループを防ぐ
      return false
    }

    // ページが存在しない場合は作成
    if (await logseq.Editor.createPage(targetPageName, "", { createFirstBlock: true, redirect: true }))
      // 作成したら再度実行
      setTimeout(() => RecodeDateToPage(userDateFormat, targetPageName, pushPageLink, true), 100)
  }
  return false
}


/**
 * ページのプロパティを更新する
 * @param addProperty 追加するプロパティ
 * @param targetProperty 更新するプロパティの種類
 * @param PageProperties ページのプロパティ
 * @param addType 追加するプロパティのタイプ
 * @param firstBlockUUID ページの最初のブロックのUUID
 * @returns 編集されたブロックのUUID
 */
const updatePageProperties = async (addProperty: string, targetProperty: string, PageProperties, addType: string, firstBlockUUID: string) => {
  let editBlockUUID

  // 削除するプロパティのリスト
  let deleteArray = ['Projects', 'Resources', 'Areas of responsibility', 'Archives']

  if (PageProperties !== null) {
    if (typeof PageProperties === "object") { //ページプロパティが存在した場合
      // オブジェクトのキーに値がない場合は削除
      for (const [key, value] of Object.entries(PageProperties)) {
        if (!value) delete PageProperties[key]
      }

      // PARAの場合は一致するもの以外のリストを使用
      if (addType === "PARA") deleteArray = deleteArray.filter(element => element !== addProperty)

      let PropertiesArray = PageProperties[targetProperty] || []

      if (PropertiesArray) {
        // PARAの場合はタグの重複を削除
        if (addType === "PARA") PropertiesArray = PropertiesArray.filter(property => !deleteArray.includes(property))

        PropertiesArray = [...PropertiesArray, addProperty]
      } else {
        PropertiesArray = [addProperty]
      }

      // タグの重複を削除
      PropertiesArray = [...new Set(PropertiesArray)]

      // ページのプロパティを更新
      await logseq.Editor.upsertBlockProperty(firstBlockUUID, targetProperty, PropertiesArray)
      editBlockUUID = firstBlockUUID
    } else { //ページプロパティが存在しない
      const prependProperties = {}
      prependProperties[targetProperty] = addProperty

      // ページの最初のブロックの前にプロパティを追加
      const prepend = await logseq.Editor.insertBlock(firstBlockUUID, "", { properties: prependProperties, sibling: true, before: true, isPageBlock: true, focus: true })

      if (prepend) {
        await logseq.Editor.moveBlock(prepend.uuid, firstBlockUUID, { before: true, children: true })
        editBlockUUID = prepend.uuid
      }
    }

    // ブロックを編集
    await reflectProperty(editBlockUUID)
  }

  return editBlockUUID
}


/**
 * ブロックのプロパティを編集を反映させる
 * @param editBlockUUID 編集するブロックのUUID
 */
const reflectProperty = async (editBlockUUID: any) => {
  // ブロックを編集する
  await logseq.Editor.editBlock(editBlockUUID)

  // ページプロパティを配列として読み込ませる処理
  setTimeout(function () {
    logseq.Editor.insertAtEditingCursor(",")

    // ページプロパティを読み込む
    setTimeout(async function () {
      const property = await logseq.Editor.getBlockProperty(editBlockUUID, "icon") as string | null

      if (property) {
        //propertyから「,」をすべて取り除く
        property.replace(/,/g, "")
        await logseq.Editor.upsertBlockProperty(editBlockUUID, "icon", property)

        let tagsProperty = await logseq.Editor.getBlockProperty(editBlockUUID, "tags") as string | null

        if (tagsProperty) {
          //tagsPropertyの最後に「,」を追加
          await logseq.Editor.upsertBlockProperty(editBlockUUID, "tags", tagsProperty)
          // ページプロパティを配列として読み込ませる処理
          logseq.Editor.insertAtEditingCursor(",")
        }
      }
    }, 200)
  }, 200)
}
