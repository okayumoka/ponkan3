/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Ponkanプラグイン
 */
export class PonPlugin {
  /**
   * プラグインを破棄するときに呼ばれる
   */
  public destroy(): void {
    return;
  }

  /**
   * セーブデータ保存時
   * @param data 保存先のオブジェクト
   */
  public onStore(data: any, tick: number): void {
    return;
  }

  /**
   * セーブデータ復元時
   * @param data 復元元データ
   * @param tick 復元時の時間
   * @param clear メッセージをクリアする場合はtrue
   * @param sound 音声を復元する場合はtrue
   * @param toBack 表ページを裏ページに復元する場合はtrue
   */
  public async onRestore(data: any, tick: number, clear: boolean, sound: boolean, toBack: boolean): Promise<void> {
    return;
  }

  /**
   * 状態更新時
   * @param tick 時間
   */
  public onUpdate(tick: number): void {
    return;
  }

  /**
   * 描画前
   * @param tick 時間
   */
  public beforeDraw(tick: number): void {
    return;
  }

  /**
   * ゲーム進行の状態が変化したときに呼ばれる
   * @param isStable 安定していればtrue
   */
  public onChangeStable(isStable: boolean): void {
    return;
  }

  /**
   * メッセージを一時的に隠す／戻すときに呼ばれる
   * @param visible 隠すときfalse、表示するときtrue
   */
  public onChangeMessageVisible(visible: boolean): void {
    return;
  }

  /**
   * backlayなどでレイヤーがコピーされるときに呼ばれる
   */
  public onBacklay(): void {
    return;
  }

  /**
   * backlayなどでレイヤーがコピーされるときに呼ばれる
   * @param srcLayers コピー元レイヤ
   * @param destLayers コピー先レイヤ
   * @param srcpage コピー元ページ
   * @param destpage コピー先ページ
   */
  public onCopylay(srcLayers: any[], destLayers: any[], srcpage: string, destpage: string): void {
    return;
  }

  /**
   * レイヤーの表と裏が入れ替わった後に呼ばれる。
   * 呼び出された時点で、すでにレイヤーは入れ替わっているため、
   * ここではレイヤーが入れ替わったことで情報が矛盾するものを入れ替える。
   * たとえば foreLayers や backLayers への参照を保持していた場合などは、
   * ここで入れ替える必要がある。
   */
  public onFlipLayers(): void {
    return;
  }

  /**
   * システム変数（sv）を保存する直前に呼ばれる
   */
  public onSaveSystemVariables(): void {
    return;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
