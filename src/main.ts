import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EditableBox } from './EditableBox';

class App {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private orbitControls: OrbitControls;
    private editableBox: EditableBox;

    constructor() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(2, 2, 2);
        this.camera.lookAt(0, 0, 0);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // 创建轨道控制器
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;

        // 添加灯光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(10, 20, 30);
        this.scene.add(directionalLight);

        // 创建可编辑的盒子
        this.editableBox = new EditableBox(
            this.scene,
            this.camera,
            this.renderer,
            this.orbitControls
        );

        // 初始化编辑器
        this.initEditor();

        // 添加窗口大小变化监听
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // 开始动画循环
        this.animate();
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        this.orbitControls.update();
        this.renderer.render(this.scene, this.camera);
    }

    private initEditor(): void {
        // 这个方法确保 editableBox 被使用
        // 实际上我们需要保持这个引用以维持对象的生命周期
        if (!this.editableBox) {
            console.error('EditableBox not initialized');
        }
    }
}

// 创建应用实例
new App(); 