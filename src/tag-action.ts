import { AsyncCallbacks } from "./base/async-callbacks";
import { AsyncTask } from "./base/async-task";
import { Logger } from "./base/logger";
import { PonEventHandler} from "./base/pon-event-handler";
import { Resource } from "./base/resource";
import { Sound } from "./base/sound";
import { Tag } from "./base/tag";
import { BaseLayer } from "./base/base-layer";
import { PonLayer } from "./layer/pon-layer";
import { Ponkan3 } from "./ponkan3";

export class TagValue {
  public name: string;
  public type: "number" | "boolean" | "string" | "array" | "object";
  public required: boolean;
  public defaultValue: any;
  public comment: string;

  public constructor(
    name: string,
    type: "number" | "boolean" | "string" | "array" | "object",
    required: boolean,
    defaultValue: any,
    comment: string) {
    this.name = name;
    this.type = type;
    this.required = required;
    this.defaultValue = defaultValue;
    this.comment = comment;
  }
}

export class TagAction {
  public names: string[];
  public comment: string;
  public values: TagValue[];
  public description: string;
  public action: (values: any, tick: number) => "continue" | "break";

  public constructor(
    names: string[],
    comment: string,
    values: TagValue[],
    description: string,
    action: (val: any, tick: number) => "continue" | "break",
  ) {
    this.names = names;
    this.comment = comment;
    this.values = values;
    this.description = description;
    this.action = action;
  }
}

/**
 * エンティティを適用する
 */
export function applyJsEntity(resource: Resource, values: any): void {
  for (const key in values) {
    if (values.hasOwnProperty(key)) {
      const value: string = "" + values[key] as string;
      if (value.indexOf("&") === 0 && value.length >= 2) {
        const js: string = value.substring(1);
        values[key] = resource.evalJs(js);
      }
    }
  }
}

/**
 * タグの値を正しい値にキャストする。
 * tagの値をそのまま変更するため、事前にcloneしたものにしておくこと。
 * @param tag タグ
 * @param tagAction タグ動作定義
 */
export function castTagValues(tag: Tag, tagAction: TagAction) {
  tagAction.values.forEach((def: TagValue) => {
    const value: any = tag.values[def.name];
    if (value === undefined || value === null) { return; }
    if (typeof value !== def.type) {
      const str: string = "" + value;
      switch (def.type) {
        case "number":
          tag.values[def.name] = +str;
          if (isNaN(tag.values[def.name])) {
            throw new Error(`${tag.name}タグの${def.name}を数値に変換できませんでした(${str})`);
          }
          break;
        case "boolean":
          tag.values[def.name] = (str === "true");
          break;
        case "string":
          tag.values[def.name] = str;
          break;
        case "array":
          // Logger.debug(Array.isArray(value));
          // Logger.debug(typeof value);
          if (!Array.isArray(value)) {
            Logger.debug(value);
            throw new Error(`${tag.name}タグの${def.name}は配列である必要があります`);
          }
          tag.values[def.name] = value;
          break;
        case "object":
          if (typeof value !== "object" || Array.isArray(value)) {
            Logger.debug(value);
            throw new Error(`${tag.name}タグの${def.name}はオブジェクトである必要があります`);
          }
          tag.values[def.name] = value;
          break;
      }
    }
  });
}

export function generateTagActions(p: Ponkan3): TagAction[] {
  return [
    // ======================================================================
    // その他
    // ======================================================================
    new TagAction(
      ["laycount"],
      "レイヤーの数を変更する",
      [
        new TagValue("count", "number", true, null, "レイヤー数"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.layerCount = values.count;
        return "continue";
      },
    ),
    new TagAction(
      ["raiseerror"],
      "エラーを発生させるかどうかの設定",
      [
        new TagValue("unknowntag", "boolean", false, null, "存在しないタグを実行したときにエラーにする"),
      ],
      "",
      (values, tick) => {
        if (values.unknowntag != null) { p.raiseError.unknowntag = values.unknowntag; }
        return "continue";
      },
    ),
    new TagAction(
      ["s"],
      "スクリプトの実行を停止する",
      [],
      "TODO タグの説明文",
      (values, tick) => {
        p.conductor.stop();
        p.stopSkip();
        return "break";
      },
    ),
    new TagAction(
      ["jump"],
      "スクリプトファイルを移動する",
      [
        new TagValue("file", "string", false, null, "移動先のスクリプトファイル名。省略時は現在のファイル内で移動する"),
        new TagValue("label", "string", false, null, "移動先のラベル名。省略時はファイルの先頭"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.conductor.jump(values.file, values.label).done(() => {
          p.conductor.start();
        });
        return p.conductor.stop();
      },
    ),
    new TagAction(
      ["call"],
      "サブルーチンを呼び出す",
      [
        new TagValue("file", "string", false, null, "移動先のスクリプトファイル名。省略時は現在のファイル内で移動する"),
        new TagValue("label", "string", false, null, "移動先のラベル名。省略時はファイルの先頭"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.conductor.callSubroutine(values.file, values.label).done(() => {
          p.conductor.start();
        });
        return p.conductor.stop();
      },
    ),
    new TagAction(
      ["return"],
      "サブルーチンをから戻る",
      [
        new TagValue("file", "string", false, null, "移動先のスクリプトファイル名。省略時は現在のファイル内で移動する"),
        new TagValue("label", "string", false, null, "移動先のラベル名。省略時はファイルの先頭"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        return p.conductor.returnSubroutine();
      },
    ),
    new TagAction(
      ["if"],
      "条件によって分岐する",
      [
        new TagValue("exp", "string", true, null, "条件式(JavaScript)"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.conductor.script.ifJump(values.exp, p.tagActions);
        return "continue";
      },
    ),
    new TagAction(
      ["elseif", "elsif"],
      "条件によって分岐する",
      [],
      "TODO タグの説明文",
      (values, tick) => {
        p.conductor.script.elsifJump();
        return "continue";
      },
    ),
    new TagAction(
      ["else"],
      "条件によって分岐する",
      [],
      "TODO タグの説明文",
      (values, tick) => {
        p.conductor.script.elseJump();
        return "continue";
      },
    ),
    new TagAction(
      ["endif"],
      "条件分岐の終了",
      [],
      "TODO タグの説明文",
      (values, tick) => {
        return "continue";
      },
    ),
    new TagAction(
      ["for"],
      "指定回数繰り返す",
      [
        new TagValue("loops", "number", true, null, "繰り替えし回数"),
        new TagValue("indexvar", "string", false, "__index__", "ループ中のインデックスを格納する変数名"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.conductor.script.startForLoop(values.loops, values.indexvar);
        return "continue";
      },
    ),
    new TagAction(
      ["endfor"],
      "forループの終端",
      [],
      "TODO タグの説明文",
      (values, tick) => {
        p.conductor.script.endForLoop();
        return "continue";
      },
    ),
    new TagAction(
      ["breakfor"],
      "forループから抜ける",
      [],
      "TODO タグの説明文",
      (values, tick) => {
        p.conductor.script.breakForLoop();
        return "continue";
      },
    ),
    // ======================================================================
    // マクロ
    // ======================================================================
    new TagAction(
      ["macro"],
      "マクロを定義する",
      [
        new TagValue("name", "string", true, null, "マクロの名前"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        if (p.resource.hasMacro(values.name)) {
          throw new Error(`${values.name}マクロはすでに登録されています`);
        }
        const m = p.conductor.script.defineMacro(values.name);
        p.resource.macroInfo[values.name] = m;
        return "continue";
      },
    ),
    new TagAction(
      ["endmacro"],
      "マクロ定義の終わり",
      [],
      "TODO タグの説明文",
      (values, tick) => {
        throw new Error("マクロ定義エラー。macroとendmacroの対応が取れていません");
        return "continue";
      },
    ),
    // ======================================================================
    // メッセージ関係
    // ======================================================================
    new TagAction(
      ["messageopt", "mesopt"],
      "テキストの設定",
      [
        new TagValue("lay", "string", false, "message", "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
        new TagValue("fontfamily", "array", false, null, "フォント名の配列"),
        new TagValue("sise", "number", false, null, "フォントサイズ(px)"),
        new TagValue("weight", "string", false, null, `フォントウェイト。"normal" / "bold"`),
        new TagValue("color", "number", false, null, "文字色(0xRRGGBB)"),
        new TagValue("margint", "number", false, null, "テキスト描画のマージン　上"),
        new TagValue("marginr", "number", false, null, "テキスト描画のマージン　右"),
        new TagValue("marginb", "number", false, null, "テキスト描画のマージン　下"),
        new TagValue("marginl", "number", false, null, "テキスト描画のマージン　左"),
        new TagValue("lineheight", "number", false, null, "テキストの行の高さ(px)"),
        new TagValue("linepitch", "number", false, null, "テキストの行間(px)"),
        new TagValue("align", "string", false, null, `テキスト寄せの方向。"left" / "center" / "right"`),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          if (values.fontfamily != null) { layer.textFontFamily = values.fontfamily; }
          if (values.sise != null) { layer.textFontSize = values.size; }
          if (values.weight != null) { layer.textFontWeight = values.weight; }
          if (values.color != null) { layer.textColor = values.color; }
          if (values.margint != null) { layer.textMarginTop = values.margint; }
          if (values.marginr != null) { layer.textMarginRight = values.marginr; }
          if (values.marginb != null) { layer.textMarginBottom = values.marginb; }
          if (values.marginl != null) { layer.textMarginLeft = values.marginl; }
          if (values.lineheight != null) { layer.textLineHeight = values.lineheight; }
          if (values.linepitch != null) { layer.textLinePitch = values.linepitch; }
          if (values.align != null) { layer.textAlign = values.align; }
        });
        return "continue";
      },
    ),
    new TagAction(
      ["ch"],
      "文字を出力する",
      [
        new TagValue("text", "string", true, null, "出力する文字"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.messageLayer.addChar(values.text);
        if (p.skipMode === "invalid") {
          return p.conductor.sleep(tick, p.textSpeed);
        } else {
          return "continue";
        }
      },
    ),
    new TagAction(
      ["br"],
      "改行する",
      [],
      "TODO タグの説明文",
      (values, tick) => {
        p.messageLayer.addTextReturn();
        return "continue";
      },
    ),
    new TagAction(
      ["clear", "c"],
      "テキストをクリアする",
      [
        new TagValue("lay", "string", false, "message", "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.clearText();
        })
        return "continue";
      },
    ),
    new TagAction(
      ["textspeed"],
      "文字出力のインターバルを設定",
      [
        new TagValue("time", "number", true, null, "インターバル時間(ms)"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.textSpeed = values.time;
        return "continue";
      },
    ),
    new TagAction(
      ["indent"],
      "インデント位置を設定する",
      [],
      "TODO タグの説明文",
      (values, tick) => {
        p.messageLayer.setIndentPoint();
        return "continue";
      },
    ),
    new TagAction(
      ["linebreak", "lb", "l"],
      "行末クリック待ちで停止する",
      [],
      "TODO タグの説明文",
      (values, tick) => {
        p.showLineBreakGlyph(tick);
        p.stopWaitClickSkip();
        p.addEventHandler(new PonEventHandler("click", "waitClickCallback", "lb"));
        return p.conductor.stop();
      },
    ),
    new TagAction(
      ["pagebreak", "pb", "p"],
      "行末クリック待ちで停止する",
      [],
      "TODO タグの説明文",
      (values, tick) => {
        p.showPageBreakGlyph(tick);
        p.stopWaitClickSkip();
        p.addEventHandler(new PonEventHandler("click", "waitClickCallback", "pb"));
        return p.conductor.stop();
      },
    ),
    // ======================================================================
    // レイヤー関係
    // ======================================================================
    new TagAction(
      ["messagelay", "meslay"],
      "メッセージレイヤーを指定する",
      [
        new TagValue("lay", "number", true, null, "対象レイヤー"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        const lay: number = +values.lay;
        if (lay < 0 || p.layerCount <= lay) {
          throw new Error("メッセージレイヤーの指定が範囲外です");
        }
        p.messageLayerNum = lay;
        // TODO メッセージレイヤーの初期化
        return "continue";
      },
    ),
    new TagAction(
      ["linebreakglyph", "lbglyph"],
      "行末グリフに関して設定する",
      [
        new TagValue("lay", "number", false, null, "グリフとして使用するレイヤー"),
        new TagValue("pos", "string", false, null,
          `グリフの表示位置。"eol"を指定すると文章の末尾に表示。"fixed"を指定すると固定位置で表示。` +
          `"eol"を指定すると文章の末尾に表示。` +
          `"relative"を指定するとメッセージレイヤーとの相対位置で固定表示。` +
          `"absolute"を指定すると画面上の絶対位置で固定表示。`),
        new TagValue("x", "number", false, null, "グリフの表示位置（メッセージレイヤーからの相対位置）"),
        new TagValue("y", "number", false, null, "グリフの表示位置（メッセージレイヤーからの相対位置）"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        if (values.lay != null) { p.lineBreakGlyphLayerNum = values.lay; }
        if (values.pos != null) { p.lineBreakGlyphPos = values.pos; }
        if (values.x != null) { p.lineBreakGlyphX = values.x; }
        if (values.y != null) { p.lineBreakGlyphY = values.y; }
        return "continue";
      },
    ),
    new TagAction(
      ["pagebreakglyph", "pbglyph"],
      "ページ末グリフに関して設定する",
      [
        new TagValue("lay", "number", false, null, "グリフとして使用するレイヤー"),
        new TagValue("pos", "string", false, null,
          `グリフの表示位置。"eol"を指定すると文章の末尾に表示。"fixed"を指定すると固定位置で表示。` +
          `"eol"を指定すると文章の末尾に表示。` +
          `"relative"を指定するとメッセージレイヤーとの相対位置で固定表示。` +
          `"absolute"を指定すると画面上の絶対位置で固定表示。`),
        new TagValue("x", "number", false, null, "グリフの表示位置（メッセージレイヤーからの相対位置）"),
        new TagValue("y", "number", false, null, "グリフの表示位置（メッセージレイヤーからの相対位置）"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        if (values.lay != null) { p.pageBreakGlyphLayerNum = values.lay; }
        if (values.pos != null) { p.pageBreakGlyphPos = values.pos; }
        if (values.x != null) { p.pageBreakGlyphX = values.x; }
        if (values.y != null) { p.pageBreakGlyphY = values.y; }
        return "continue";
      },
    ),
    new TagAction(
      ["fillcolor", "fill"],
      "レイヤーを塗りつぶす",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
        new TagValue("color", "number", true, null, "塗りつぶし色(0xRRGGBB)"),
        new TagValue("alpha", "number", false, 1.0, "塗りつぶしのAlpha(0.0〜1.0)"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.setBackgroundColor(values.color, values.alpha);
        });
        return "continue";
      },
    ),
    new TagAction(
      ["clearcolor"],
      "レイヤー塗りつぶしをクリアする",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.clearBackgroundColor();
        });
        return "continue";
      },
    ),
    new TagAction(
      ["layopt"],
      "レイヤーの設定",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
        new TagValue("visible", "boolean", false, null, "表示非表示"),
        new TagValue("x", "number", false, null, "x座標(px)"),
        new TagValue("y", "number", false, null, "y座標(px)"),
        new TagValue("width", "number", false, null, "幅(px)"),
        new TagValue("height", "number", false, null, "高さ(px)"),
        new TagValue("alpha", "number", false, 1.0, "レイヤーのAlpha(0.0〜1.0)"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          if (values.visible != null) { layer.visible = values.visible; }
          if (values.x != null) { layer.x = values.x; }
          if (values.y != null) { layer.y = values.y; }
          if (values.width != null) { layer.width = values.width; }
          if (values.height != null) { layer.height = values.height; }
          if (values.alpha != null) { layer.alpha = values.alpha; }
        });
        return "continue";
      },
    ),
    new TagAction(
      ["loadimage", "image"],
      "レイヤーに画像を読み込む",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
        new TagValue("file", "string", true, null, "読み込む画像ファイルパス"),
        new TagValue("visible", "boolean", false, null, "表示非表示"),
        new TagValue("x", "number", false, null, "x座標(px)"),
        new TagValue("y", "number", false, null, "y座標(px)"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        const task: AsyncTask = new AsyncTask();
        p.getLayers(values).forEach((layer) => {
          task.add(() => {
            if (values.x != null) { layer.x = values.x; }
            if (values.y != null) { layer.y = values.y; }
            if (values.visible != null) { layer.visible = values.visible; }
            return layer.loadImage(values.file);
          });
        });
        task.run().done(() => {
          p.conductor.start();
        }).fail(() => {
          p.error(new Error("画像読み込みに失敗しました。"));
        });
        return p.conductor.stop();
      },
    ),
    new TagAction(
      ["freeimage", "free"],
      "レイヤーの画像を開放する",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.freeImage();
        });
        return "continue";
      },
    ),
    new TagAction(
      ["backlay"],
      "表レイヤを裏レイヤにコピーする",
      [
        new TagValue("lay", "number", false, "all", "対象レイヤー"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        values.page = "fore";
        let fore: PonLayer[] = p.getLayers(values);
        values.page = "back";
        let back: PonLayer[] = p.getLayers(values);
        for (let i = 0; i < fore.length; i++) {
          fore[i].copyTo(back[i]);
        }
        return "continue";
      },
    ),
    // ======================================================================
    // ボタン関係
    // ======================================================================
    new TagAction(
      ["textbutton", "txtbtn"],
      "レイヤーにテキストボタンを配置する",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
        new TagValue("jumpfile", "string", false, null, "ボタン押下時にjumpするスクリプトファイル名"),
        new TagValue("callfile", "string", false, null, "ボタン押下時にcallするスクリプトファイル名"),
        new TagValue("jumplabel", "string", false, null, "jump先のラベル名"),
        new TagValue("calllabel", "string", false, null, "call先のラベル名"),
        new TagValue("exp", "string", false, null, "ボタン押下時に実行するJavaScript"),
        new TagValue("text", "string", true, null, "テキスト"),
        new TagValue("x", "number", false, 0, "x座標(px)"),
        new TagValue("y", "number", false, 0, "y座標(px)"),
        new TagValue("width", "number", true, null, "幅(px)"),
        new TagValue("height", "number", true, null, "高さ(px)"),
        new TagValue("bgcolors", "array", true, null, "背景色の配列(0xRRGGBB)。通常時、マウスオーバー時、マウス押下時の順"),
        new TagValue("bgalphas", "array", false, [1, 1, 1], "背景色のAlphaの配列(0.0〜1.0)。通常時、マウスオーバー時、マウス押下時の順"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.addTextButton(
            values.jumpfile,
            values.callfile,
            values.jumplabel,
            values.calllabel,
            values.exp,
            values.text,
            values.x,
            values.y,
            values.width,
            values.height,
            values.bgcolors,
            values.bgalphas,
          );
        });
        return "continue";
      },
    ),
    new TagAction(
      ["cleartextbutton", "cleartxtbtn"],
      "テキストボタンをクリアする",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.clearTextButtons();
        });
        return "continue";
      },
    ),
    new TagAction(
      ["imagebutton", "imgbtn"],
      "レイヤーに画像ボタンを配置する",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
        new TagValue("jumpfile", "string", false, null, "ボタン押下時にjumpするスクリプトファイル名"),
        new TagValue("callfile", "string", false, null, "ボタン押下時にcallするスクリプトファイル名"),
        new TagValue("jumplabel", "string", false, null, "jump先のラベル名"),
        new TagValue("calllabel", "string", false, null, "call先のラベル名"),
        new TagValue("exp", "string", false, null, "ボタン押下時に実行するJavaScript"),
        new TagValue("file", "string", true, null, "ボタンにする画像ファイル"),
        new TagValue("x", "number", false, 0, "x座標(px)"),
        new TagValue("y", "number", false, 0, "y座標(px)"),
        new TagValue("direction", "string", false, "horizontal", `ボタン画像ファイルの向き。"horizontal"なら横並び、"vertical"なら縦並び"`),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.addImageButton(
            values.jumpfile,
            values.callfile,
            values.jumplabel,
            values.calllabel,
            values.exp,
            values.file,
            values.x,
            values.y,
            values.direction,
          ).done(() => {
            p.conductor.start();
          });
        });
        return p.conductor.stop();
      },
    ),
    new TagAction(
      ["clearimagebutton", "clearimgbtn"],
      "画像ボタンをクリアする",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.clearImageButtons();
        });
        return "continue";
      },
    ),
    new TagAction(
      ["togglebutton", "tglbtn"],
      "レイヤーにトグルボタンを配置する",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
        new TagValue("exp", "string", false, null, "ボタン押下時に実行するJavaScript"),
        new TagValue("file", "string", true, null, "ボタンにする画像ファイル"),
        new TagValue("x", "number", false, 0, "x座標(px)"),
        new TagValue("y", "number", false, 0, "y座標(px)"),
        new TagValue("statevar", "string", true, null, "選択状態を格納する一時変数の名前"),
        new TagValue("direction", "string", false, "horizontal", `ボタン画像ファイルの向き。"horizontal"なら横並び、"vertical"なら縦並び"`),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.addToggleButton(
            values.file,
            values.x,
            values.y,
            values.statevar,
            values.exp,
            values.direction,
          ).done(() => {
            p.conductor.start();
          });
        });
        return p.conductor.stop();
      },
    ),
    new TagAction(
      ["cleartogglebutton", "cleartglbtn"],
      "トグルボタンをクリアする",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.clearToggleButtons();
        });
        return "continue";
      },
    ),

    // ======================================================================
    // アニメーション関係
    // ======================================================================
    new TagAction(
      ["frameanim", "fanim"],
      "フレームアニメーションを設定する",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
        new TagValue("loop", "boolean", false, false, "アニメーションをループさせるかどうか"),
        new TagValue("time", "number", true, null, "1フレームの時間"),
        new TagValue("width", "number", true, null, "1フレームの幅"),
        new TagValue("height", "number", true, null, "1フレームの高さ"),
        new TagValue("frames", "array", true, null, "フレーム指定"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.initFrameAnim(values.loop, values.time, values.width, values.height, values.frames);
        });
        return "continue";
      },
    ),
    new TagAction(
      ["startframeanim", "startfanim"],
      "フレームアニメーションを開始する",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.startFrameAnim(tick);
        });
        return "continue";
      },
    ),
    new TagAction(
      ["stopframeanim", "stopfanim"],
      "フレームアニメーションを停止する",
      [
        new TagValue("lay", "string", true, null, "対象レイヤー"),
        new TagValue("page", "string", false, "fore", "対象ページ"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getLayers(values).forEach((layer) => {
          layer.deleteFrameAnim();
        });
        return "continue";
      },
    ),
    // ======================================================================
    // サウンド関係
    // ======================================================================
    new TagAction(
      ["loadsound", "sound"],
      "音声をロードする",
      [
        new TagValue("buf", "number", true, null, "読み込み先バッファ番号"),
        new TagValue("file", "string", true, null, "読み込む音声ファイルパス"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getSoundBuffer(values.buf).loadSound(values.file).done((sound) => {
          p.conductor.start();
        }).fail(() => {
          throw new Error(`音声のロードに失敗しました(${values.file})`);
        });
        return p.conductor.stop();
      },
    ),
    new TagAction(
      ["freesound", "unloadsound"],
      "音声を開放する",
      [
        new TagValue("buf", "number", true, null, "読み込み先バッファ番号"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getSoundBuffer(values.buf).unloadSound();
        return "continue";
      },
    ),
    new TagAction(
      ["soundopt"],
      "音声の設定",
      [
        new TagValue("buf", "number", true, null, "バッファ番号"),
        new TagValue("volume", "number", false, null, "音量(0.0〜1.0)"),
        new TagValue("volume2", "number", false, null, "音量2(0.0〜1.0)"),
        new TagValue("seek", "number", false, null, "シーク位置(ms)"),
        new TagValue("loop", "boolean", false, null, "ループ再生するかどうか"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        const s: Sound = p.getSound(values.buf);
        if (values.volume != null) { s.volume = values.volume; }
        if (values.volume2 != null) { s.volume2 = values.volume2; }
        if (values.seek != null) { s.seek = values.seek; }
        if (values.loop != null) { s.loop = values.loop; }
        return "continue";
      },
    ),
    new TagAction(
      ["playsound"],
      "音声を再生する",
      [
        new TagValue("buf", "number", true, null, "読み込み先バッファ番号"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getSound(values.buf).play();
        return "continue";
      },
    ),
    new TagAction(
      ["stopsound"],
      "音声を停止する",
      [
        new TagValue("buf", "number", true, null, "読み込み先バッファ番号"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getSound(values.buf).stop();
        return "continue";
      },
    ),
    new TagAction(
      ["fadesound"],
      "音声をフェードする",
      [
        new TagValue("buf", "number", true, null, "読み込み先バッファ番号"),
        new TagValue("volume", "number", true, null, "フェード後の音量(0.0〜1.0)"),
        new TagValue("time", "number", true, null, "フェード時間(ms)"),
        new TagValue("autostop", "boolean", false, false, "フェード終了後に再生停止するか"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getSound(values.buf).fade(values.volume, values.time, values.autostop);
        return "continue";
      },
    ),
    new TagAction(
      ["fadeoutsound", "fadeout"],
      "音声をフェードアウトして再生停止する",
      [
        new TagValue("buf", "number", true, null, "読み込み先バッファ番号"),
        new TagValue("time", "number", true, null, "フェード時間(ms)"),
        new TagValue("autostop", "boolean", false, false, "フェード終了後に再生停止するか"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getSound(values.buf).fadeout(values.time, values.autostop);
        return "continue";
      },
    ),
    new TagAction(
      ["fadeinsound", "fadein"],
      "音声をフェードインで再生開始する",
      [
        new TagValue("buf", "number", true, null, "読み込み先バッファ番号"),
        new TagValue("volume", "number", true, null, "フェード後の音量(0.0〜1.0)"),
        new TagValue("time", "number", true, null, "フェード時間(ms)"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.getSound(values.buf).fadein(values.volume, values.time);
        return "continue";
      },
    ),
    // ======================================================================
    // トランジション
    // ======================================================================
    new TagAction(
      ["trans"],
      "トランジションを実行する",
      [
        new TagValue("time", "number", true, null, "トランジションの時間(ms)"),
        new TagValue("method", "string", false, "crossfade", "トランジションの種類"),
        new TagValue("rule", "string", false, "", "ユニバーサルトランジションのルールファイル名"),
        new TagValue("vague", "number", false, 0.25, "あいまい値"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        if (values.method === "univ") {
          p.transManager.initUnivTrans(values.time, values.rule, values.vague).done(() => {
            p.transManager.start();
            p.conductor.start();
          });
          return p.conductor.stop();
        } else {
          p.transManager.initTrans(values.time, values.method);
          p.transManager.start();
          return "continue";
        }
      },
    ),
    new TagAction(
      ["waittrans", "wt"],
      "トランジションの終了を待つ",
      [],
      "TODO タグの説明文",
      (values, tick) => {
        p.addEventHandler(new PonEventHandler("click", "waitTransClickCallback"));
        p.addEventHandler(new PonEventHandler("trans", "waitTransCompleteCallback"));
        return p.conductor.stop();
      },
    ),
    // ======================================================================
    // セーブ＆ロード関係
    // ======================================================================
    new TagAction(
      ["save"],
      "最新状態をセーブする",
      [
        new TagValue("num", "number", true, null, "セーブ番号"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.save(values.num, tick);
        return "continue";
      },
    ),
    new TagAction(
      ["load"],
      "セーブデータから復元する",
      [
        new TagValue("num", "number", true, null, "セーブ番号"),
      ],
      "TODO タグの説明文",
      (values, tick) => {
        p.load(values.num, tick).done(() => {
          p.conductor.start();
        }).fail(() => {
          p.error(new Error(`セーブデータのロードに失敗しました(${values.num})`));
        });
        return p.conductor.stop();
      },
    ),
  ];
}
