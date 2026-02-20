# -*- mode: python ; coding: utf-8 -*-

import os
import glob
from PyInstaller.utils.hooks import collect_submodules, collect_data_files, collect_all

block_cipher = None

# 获取 server 目录路径
server_dir = os.path.dirname(os.path.abspath(SPEC))

# 收集 tiktoken 的所有数据（包括 encodings 目录）
tiktoken_datas, tiktoken_binaries, tiktoken_hiddenimports = collect_all('tiktoken')

# 收集 tiktoken_ext 的数据（编码文件）
try:
    tiktoken_ext_datas = collect_data_files('tiktoken_ext')
except:
    tiktoken_ext_datas = []

# 收集 pypdf 的数据（用于 PDF 解析）
try:
    pypdf_datas = collect_data_files('pypdf')
except:
    pypdf_datas = []

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
    collect_submodules('pandas') +
    collect_submodules('openpyxl') +
    collect_submodules('dotenv') +
    collect_submodules('langchain_community.document_loaders') +
    collect_submodules('tiktoken_ext') +
    collect_submodules('tiktoken_ext.openai_public') +
    collect_submodules('pypdf')
) + tiktoken_hiddenimports

# 收集包的元数据（用于环境检测）
datas = collect_data_files('dotenv') + \
    collect_data_files('fastapi') + \
    collect_data_files('uvicorn') + \
    collect_data_files('pydantic') + \
    collect_data_files('pydantic_settings') + \
    collect_data_files('langchain') + \
    collect_data_files('langchain_community') + \
    collect_data_files('langchain_openai') + \
    collect_data_files('openai') + \
    collect_data_files('pandas') + \
    collect_data_files('openpyxl') + \
    collect_data_files('pypdf') + \
    tiktoken_datas + \
    tiktoken_ext_datas + \
    pypdf_datas

a = Analysis(
    ['run.py'],
    pathex=[server_dir],
    binaries=tiktoken_binaries,
    datas=[
        (os.path.join(server_dir, 'main.py'), '.'),
        (os.path.join(server_dir, 'services'), 'services'),
    ] + datas,
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
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
