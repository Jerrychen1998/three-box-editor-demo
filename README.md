# 3D Box Editor Demo

一个基于 Three.js 的 3D 盒子编辑器演示项目。通过直观的可视化界面，允许用户通过拖拽来编辑 3D 盒子的形状。

## 功能特点
- 基础盒子几何体的可视化
- 8个可编辑顶点（红色点）
- 12条可编辑边（蓝色线）
- 实时动态更新的几何体
- 支持点和边的拖拽编辑
- 支持场景的旋转和缩放

## 技术栈
- Three.js: 3D 渲染引擎
- TypeScript: 开发语言
- Vite: 构建工具

## 安装和运行
1. 克隆项目
```bash
git clone https://github.com/Jerrychen1998/three-box-editor-demo.git
cd three-box-editor-demo
```

2. 安装依赖
```bash
npm install
```

3. 本地开发
```bash
npm run dev
```

4. 构建项目
```bash
npm run build
```

## 使用说明
- 点击红色点可以选择并拖动顶点
- 点击蓝色线可以选择并拖动边
- 按 ESC 键取消选择
- 使用鼠标右键旋转视角
- 使用鼠标滚轮缩放场景
- 拖动顶点或边时，几何体会实时更新

## 项目结构