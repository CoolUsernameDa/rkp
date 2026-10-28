// Настройки редактора живых примеров: крупнее шрифт (по умолчанию в Slidev 11.5 px)
// и без подсветки кириллических букв, похожих на латинские («с», «о», «а»)
export default () => ({
  editorOptions: {
    fontSize: 15,
    lineHeight: 22,
    unicodeHighlight: { ambiguousCharacters: false },
  },
})
