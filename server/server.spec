# -*- mode: python ; coding: utf-8 -*-

import os
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

block_cipher = None

# 获取 server 目录路径
server_dir = os.path.dirname(os.path.abspath(SPEC))

# 自动收集所有子模块
hiddenimports = (
    collect_submodules('uvicorn') +
    collect_submodules('fastapi') +
    collect_submodules('starlette') +
    collect_submodules('langchain') +
    collect_submodules('langchain_community') +
    collect_submodules('langchain_openai') +
    collect_submodules('pydantic') +
    collect_submodules('pydantic_settings') +
    collect_submodules('openai') +
    collect_submodules('tiktoken') +
    collect_submodules('pandas') +
    collect_submodules('openpyxl') +
    collect_submodules('dotenv') +
    collect_submodules('langchain_community.document_loaders')
)

a = Analysis(
    ['run.py'],
    pathex=[server_dir],
    binaries=[],
    datas=[
        (os.path.join(server_dir, 'main.py'), '.'),
        (os.path.join(server_dir, 'services'), 'services'),
    ],
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
