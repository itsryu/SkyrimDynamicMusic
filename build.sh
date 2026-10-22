#!/bin/bash

OUTPUT_NAME="SkyrimDynamicMusic.mcaddon"

echo "📦 Iniciando empacotamento do Add-on..."

if [ -f "$OUTPUT_NAME" ]; then
    rm "$OUTPUT_NAME"
    echo "🧹 Arquivo antigo removido."
fi

zip -0 -r "$OUTPUT_NAME" "SDM_BP" "SDM_RP"

if [ $? -eq 0 ]; then
    echo "✅ Sucesso! Arquivo gerado: $OUTPUT_NAME"
else
    echo "❌ Erro ao tentar empacotamento."
fi

