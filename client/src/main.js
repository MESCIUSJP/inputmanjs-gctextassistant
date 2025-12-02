import "@mescius/inputman.richtexteditor/CSS/gc.inputman.richtexteditor.css";
import { InputMan } from "@mescius/inputman.richtexteditor";
import '@mescius/inputman.richtexteditor/JS/plugins/all/plugin.js';

// ライセンスキーの設定
//InputMan.LicenseKey = import.meta.env.VITE_INPUTMANJS_LICENSE_KEY || "";
InputMan.appearanceStyle = InputMan.AppearanceStyle.Modern;

GC.InputMan.ConfigurationManager.registerAIService(async (context) => {
  try {
    const controller = new AbortController();
    const { signal } = controller;
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPrompt: context.input,
        systemPrompt: context.prompt,
        stream: true,
      }),
      signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    if (!res.body) {
      throw new Error(
        'この環境ではReadableStreamがサポートされていない、またはレスポンスボディがnullです。'
      );
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;
    try {
      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;
        if (value) {
          const chunkText = decoder.decode(value, { stream: !done });
          if (chunkText) context.streamWriter(chunkText);
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    throw error;
  }
});

const gcRichTextEditor = new GC.InputMan.GcRichTextEditor(
  document.querySelector('#gcRichTextEditor1'),
  {
    width: 1250,
    height: 600,
    toolbar: ['newdocument', 'print', 'undo', 'redo', 'cut', 'copy', 'paste', 'pastetext', 'selectall',
      'blockquote', 'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript',
      'styles', 'fontfamily', 'fontsize', 'align', 'lineheight', 'forecolor', 'backcolor', 'removeformat',
      'outdent', 'indent', 'aitextassistant'
    ],
    menubar: ['AI'],
    menu: {
      AI: {
        title: 'AI文章作成アシスタント',
        items: ['aitextassistant'],
      },
      AITextAssistantConfig: {
        behaviorConfig: {
          dialogConfig: {
            style: GC.InputMan.AI.GcTextAssistantDialogStyle.Detail,
            width: 700,
            height: 300,
          }
        }
      },
    },
    setup: (editor) => {
      editor.addContextToolbar('textselection', {
        items: [
          GC.InputMan.GcRichTextEditorToolbarItem.AITextAssistant,
        ],
        predicate: (node) => editor.getSelection(),
        position: 'selection',
      });
    },
  }
);

