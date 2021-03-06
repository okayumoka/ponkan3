import { CommandButton, Button, ButtonStatus } from "./button";
import { FrameAnimLayer } from "./frame-anim-layer";

/**
 * テキストと背景色を指定できるボタン
 */
export class TextButton extends CommandButton {
  private txtBtnText: string = "";
  public txtBtnNormalBackgroundColor: number = 0x000000;
  public txtBtnOverBackgroundColor: number = 0x000000;
  public txtBtnOnBackgroundColor: number = 0x000000;
  public txtBtnNormalBackgroundAlpha: number = 1.0;
  public txtBtnOverBackgroundAlpha: number = 1.0;
  public txtBtnOnBackgroundAlpha: number = 1.0;

  public initTextButton(
    jump = true,
    call = false,
    filePath: string | null = null,
    label: string | null = null,
    countPage = true,
    isSystemButton = false,
    onEnterExp: string | null = null,
    onLeaveExp: string | null = null,
    onClickExp: string | null = null,
    text = "",
    normalBackgroundColor = 0x000000,
    overBackgroundColor = 0x000000,
    onBackgroundColor = 0x000000,
    normalBackgroundAlpha = 1.0,
    overBackgroundAlpha = 1.0,
    onBackgroundAlpha = 1.0,
    onEnterSoundBuf = "",
    onLeaveSoundBuf = "",
    onClickSoundBuf = "",
    keyIndex: number | null = null,
  ): void {
    this.clearCommandButton();
    this.freeImage();
    this.clearText();

    this.initCommandButton(
      jump,
      call,
      filePath,
      label,
      countPage,
      isSystemButton,
      onEnterExp,
      onLeaveExp,
      onClickExp,
      onEnterSoundBuf,
      onLeaveSoundBuf,
      onClickSoundBuf,
      keyIndex,
    );

    this.txtBtnText = text;
    this.txtBtnNormalBackgroundColor = normalBackgroundColor;
    this.txtBtnOverBackgroundColor = overBackgroundColor;
    this.txtBtnOnBackgroundColor = onBackgroundColor;
    this.txtBtnNormalBackgroundAlpha = normalBackgroundAlpha;
    this.txtBtnOverBackgroundAlpha = overBackgroundAlpha;
    this.txtBtnOnBackgroundAlpha = onBackgroundAlpha;

    this.setBackgroundColor(normalBackgroundColor, normalBackgroundAlpha);
    this.addText(text);
    this.setButtonStatus("disabled");
  }

  public clearCommandButton(): void {
    super.clearCommandButton();

    this.txtBtnText = "";
    this.txtBtnNormalBackgroundColor = 0x000000;
    this.txtBtnOverBackgroundColor = 0x000000;
    this.txtBtnOnBackgroundColor = 0x000000;
    this.txtBtnNormalBackgroundAlpha = 1.0;
    this.txtBtnOverBackgroundAlpha = 1.0;
    this.txtBtnOnBackgroundAlpha = 1.0;
  }

  public setButtonStatus(status: ButtonStatus): void {
    super.setButtonStatus(status);
    this.resetTextButtonColors();
  }

  public resetTextButtonColors(): void {
    let color: number | null = null;
    let alpha: number | null = null;
    switch (this.buttonStatus) {
      case "disabled":
        // disabledの時は直前の表示を引き継ぐ
        break;
      case "normal":
        color = this.txtBtnNormalBackgroundColor;
        alpha = this.txtBtnNormalBackgroundAlpha;
        break;
      case "over":
        color = this.txtBtnOverBackgroundColor;
        alpha = this.txtBtnOverBackgroundAlpha;
        break;
      case "on":
        color = this.txtBtnOnBackgroundColor;
        alpha = this.txtBtnOnBackgroundAlpha;
        break;
    }
    if (color != null && alpha != null) {
      this.setBackgroundColor(color, alpha);
    }
  }

  protected static textButtonStoreParams: string[] = [
    "txtBtnText",
    "txtBtnNormalBackgroundColor",
    "txtBtnOverBackgroundColor",
    "txtBtnOnBackgroundColor",
    "txtBtnNormalBackgroundAlpha",
    "txtBtnOverBackgroundAlpha",
    "txtBtnOnBackgroundAlpha",
  ];

  public store(tick: number): any {
    const data: any = super.store(tick);
    const me: any = this as any;
    TextButton.textButtonStoreParams.forEach((param: string) => {
      data[param] = me[param];
    });
    return data;
  }

  // public async restore(data: any, tick: number, clear: boolean): Promise<void> {
  //   await super.restore(data, tick, clear);
  // }

  public restoreAfterLoadImage(data: any, tick: number): void {
    super.restoreAfterLoadImage(data, tick);
    const me: any = this as any;
    TextButton.textButtonStoreParams.forEach((param: string) => {
      me[param] = data[param];
    });

    this.clearText();
    this.addText(data.txtBtnText);
  }

  public copyTo(dest: TextButton): void {
    super.copyTo(dest);

    const me: any = this as any;
    const you: any = dest as any;
    TextButton.textButtonStoreParams.forEach((param: string) => {
      you[param] = me[param];
    });
  }
}

/**
 * テキストボタンを配置できるレイヤー
 */
export class TextButtonLayer extends FrameAnimLayer {
  private textButtons: TextButton[] = [];

  public addTextButton(
    btnName = "",
    jump = true,
    call = false,
    filePath: string | null = null,
    label: string | null = null,
    countPage = true,
    onEnterExp: string | null = null,
    onLeaveExp: string | null = null,
    onClickExp: string | null = null,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    backgroundColors: number[],
    backgroundAlphas: number[],
    isSystemButton: boolean,
    textMarginTop = 0,
    textMarginRight = 0,
    textMarginBottom = 0,
    textMarginLeft = 0,
    textAlign: "left" | "center" | "right" = "center",
    onEnterSoundBuf: string,
    onLeaveSoundBuf: string,
    onClickSoundBuf: string,
    keyIndex: number | null = null,
  ): void {
    if (btnName == null || btnName === "") {
      btnName = `${this.textButtons.length}`;
    }
    const name = `TextButton ${btnName}`;
    const btn = new TextButton(name, this.resource, this.owner);
    this.addChild(btn);
    this.textButtons.push(btn);

    const normal: number = +backgroundColors[0];
    const over: number = backgroundColors[1] != null ? +backgroundColors[1] : normal;
    const on: number = backgroundColors[2] != null ? +backgroundColors[2] : normal;
    const normalAlpha: number = +backgroundAlphas[0];
    const overAlpha: number = backgroundAlphas[1] != null ? +backgroundAlphas[1] : normalAlpha;
    const onAlpha: number = backgroundAlphas[2] != null ? +backgroundAlphas[2] : normalAlpha;

    this.textCanvas.copyTo(btn.textCanvas);
    btn.x = x;
    btn.y = y;
    btn.width = width;
    btn.height = height;
    btn.textCanvas.marginTop = textMarginTop;
    btn.textCanvas.marginRight = textMarginRight;
    btn.textCanvas.marginBottom = textMarginBottom;
    btn.textCanvas.marginLeft = textMarginLeft;
    btn.textCanvas.align = textAlign;
    btn.clearText();
    btn.initTextButton(
      jump,
      call,
      filePath,
      label,
      countPage,
      isSystemButton,
      onEnterExp,
      onLeaveExp,
      onClickExp,
      text,
      normal,
      over,
      on,
      normalAlpha,
      overAlpha,
      onAlpha,
      onEnterSoundBuf,
      onLeaveSoundBuf,
      onClickSoundBuf,
      keyIndex,
    );
  }

  public clearTextButtons(): void {
    this.textButtons.forEach((textButton) => {
      textButton.clearCommandButton();
      textButton.destroy();
      this.deleteChildLayer(textButton);
    });
    this.textButtons = [];
  }

  public changeTextButtonColors(btnName: string, backgroundColors: number[]): void {
    const normal: number = +backgroundColors[0];
    const over: number = backgroundColors[1] != null ? +backgroundColors[1] : normal;
    const on: number = backgroundColors[2] != null ? +backgroundColors[2] : normal;
    this.findTextButtonByName(btnName).forEach((btn) => {
      btn.txtBtnNormalBackgroundColor = normal;
      btn.txtBtnOverBackgroundColor = over;
      btn.txtBtnOnBackgroundColor = on;
      btn.resetTextButtonColors();
    });
  }

  public changeTextButtonAlphas(btnName: string, backgroundAlphas: number[]): void {
    const normalAlpha: number = +backgroundAlphas[0];
    const overAlpha: number = backgroundAlphas[1] != null ? +backgroundAlphas[1] : normalAlpha;
    const onAlpha: number = backgroundAlphas[2] != null ? +backgroundAlphas[2] : normalAlpha;
    this.findTextButtonByName(btnName).forEach((btn) => {
      btn.txtBtnNormalBackgroundAlpha = normalAlpha;
      btn.txtBtnOverBackgroundAlpha = overAlpha;
      btn.txtBtnOnBackgroundAlpha = onAlpha;
      btn.resetTextButtonColors();
    });
  }

  public findTextButtonByName(btnName: string): TextButton[] {
    const name = `TextButton ${btnName}`;
    return this.textButtons.filter((l) => l.name === name);
  }

  public hasTextButton(): boolean {
    return this.textButtons.length > 0;
  }

  public getButtons(): Button[] {
    const buttons: Button[] = [];
    this.textButtons.forEach((textButton) => {
      buttons.push(textButton as Button);
    });
    return buttons;
  }

  public lockButtons(): void {
    this.textButtons.forEach((textButton) => {
      textButton.setButtonStatus("disabled");
    });
  }

  public unlockButtons(): void {
    this.textButtons.forEach((textButton) => {
      textButton.setButtonStatus("normal");
    });
  }

  public lockSystemButtons(): void {
    this.textButtons.forEach((textButton) => {
      textButton.lockSystemButton();
    });
  }

  public unlockSystemButtons(): void {
    this.textButtons.forEach((textButton) => {
      textButton.unlockSystemButton();
    });
  }

  public store(tick: number): any {
    const data: any = super.store(tick);
    // const me: any = this as any;

    data.textButtons = this.textButtons.map((textButton) => textButton.store(tick));

    return data;
  }

  public async restore(data: any, tick: number, clear: boolean): Promise<void> {
    this.clearTextButtons();
    if (data.textButtons != null && data.textButtons.length > 0) {
      await Promise.all(
        data.textButtons.map((textButtonData: any) => {
          const btn = new TextButton(textButtonData.name, this.resource, this.owner);
          this.addChild(btn);
          this.textButtons.push(btn);
          return btn.restore(textButtonData, tick, clear);
        }),
      );
    }
    await super.restore(data, tick, clear);
  }

  protected restoreAfterLoadImage(data: any, tick: number): void {
    super.restoreAfterLoadImage(data, tick);
    if (data.textButtons != null && data.textButtons.length > 0) {
      for (let i = 0; i < data.textButtons.length; i++) {
        this.textButtons[i].restoreAfterLoadImage(data.textButtons[i], tick);
      }
    }
  }

  public copyTo(dest: TextButtonLayer): void {
    super.copyTo(dest);

    dest.clearTextButtons();
    this.textButtons.forEach((srcBtn) => {
      const destBtn = new TextButton(name, dest.resource, dest.owner);
      dest.addChild(destBtn);
      dest.textButtons.push(destBtn);
      srcBtn.copyTo(destBtn);
    });
  }
}
