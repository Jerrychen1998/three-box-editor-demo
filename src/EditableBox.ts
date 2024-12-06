import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class EditableBox {
    private geometry!: THREE.BufferGeometry;
    private material!: THREE.MeshPhongMaterial;
    private mesh!: THREE.Mesh;
    private edges!: THREE.LineSegments;
    private edgeMaterial!: THREE.LineBasicMaterial;
    private transformControl: TransformControls;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private orbitControls: OrbitControls;
    private vertexDots: THREE.Mesh[] = [];
    private edgeHelpers: THREE.Mesh[] = [];
    private selectedPoint: THREE.Vector3 | null = null;
    private selectedEdge: { start: THREE.Vector3, end: THREE.Vector3 } | null = null;
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();

    constructor(
        scene: THREE.Scene, 
        camera: THREE.PerspectiveCamera, 
        renderer: THREE.WebGLRenderer,
        orbitControls: OrbitControls
    ) {
        this.scene = scene;
        this.camera = camera;
        this.orbitControls = orbitControls;

        // 创建基础几何体
        this.createBoxGeometry();
        
        // 创建材质
        this.material = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        this.edgeMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 3
        });

        // 创建网格
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        // 创建边缘线条
        this.updateEdges();

        // 创建变换控制器
        this.transformControl = new TransformControls(camera, renderer.domElement);
        this.transformControl.addEventListener('dragging-changed', (event: any) => {
            this.orbitControls.enabled = !event.value;
            if (!event.value) {
                this.updateGeometry();
            }
        });
        this.scene.add(this.transformControl);

        // 创建顶点和边的辅助对象
        this.createVertexDots();
        this.createEdgeHelpers();

        // 添加事件监听
        renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    private createBoxGeometry(): void {
        // 创建8个顶点
        const vertices = [
            // 底面顶点
            new THREE.Vector3(-0.5, -0.5, -0.5),  // 0: 左前下
            new THREE.Vector3(0.5, -0.5, -0.5),   // 1: 右前下
            new THREE.Vector3(0.5, -0.5, 0.5),    // 2: 右后下
            new THREE.Vector3(-0.5, -0.5, 0.5),   // 3: 左后下

            // 顶面顶点
            new THREE.Vector3(-0.5, 0.5, -0.5),   // 4: 左前上
            new THREE.Vector3(0.5, 0.5, -0.5),    // 5: 右前上
            new THREE.Vector3(0.5, 0.5, 0.5),     // 6: 右后上
            new THREE.Vector3(-0.5, 0.5, 0.5),    // 7: 左后上
        ];

        // 创建面的索引（12个三角形，每个面2个三角形）
        const indices = [
            // 底面
            0, 1, 2,    0, 2, 3,
            // 顶面
            4, 7, 6,    4, 6, 5,
            // 前面
            0, 4, 5,    0, 5, 1,
            // 后面
            2, 6, 7,    2, 7, 3,
            // 左面
            0, 3, 7,    0, 7, 4,
            // 右面
            1, 5, 6,    1, 6, 2
        ];

        // 创建几何体
        this.geometry = new THREE.BufferGeometry();

        // 创建顶点位置属性
        const positions = new Float32Array(vertices.length * 3);
        vertices.forEach((vertex, i) => {
            positions[i * 3] = vertex.x;
            positions[i * 3 + 1] = vertex.y;
            positions[i * 3 + 2] = vertex.z;
        });

        // 设置顶点位置和索引
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setIndex(indices);

        // 计算法线
        this.geometry.computeVertexNormals();
    }

    private updateEdges(): void {
        const edgesGeometry = new THREE.EdgesGeometry(this.geometry);
        
        if (this.edges) {
            this.scene.remove(this.edges);
            this.edges.geometry.dispose();
        }
        
        this.edges = new THREE.LineSegments(edgesGeometry, this.edgeMaterial);
        this.scene.add(this.edges);
    }

    private createVertexDots(): void {
        // 清除现有的顶点辅助点
        this.vertexDots.forEach(dot => {
            this.scene.remove(dot);
            dot.geometry.dispose();
            (dot.material as THREE.Material).dispose();
        });
        this.vertexDots = [];

        // 获取几何体的顶点
        const positions = this.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const vertex = new THREE.Vector3(
                positions.getX(i),
                positions.getY(i),
                positions.getZ(i)
            );

            const vertexDot = new THREE.Mesh(
                new THREE.SphereGeometry(0.02),
                new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    transparent: true,
                    opacity: 0.5,
                    depthTest: true
                })
            );
            vertexDot.position.copy(vertex);
            vertexDot.userData.index = i;
            this.scene.add(vertexDot);
            this.vertexDots.push(vertexDot);
        }
    }

    private createEdgeHelpers(): void {
        // 清除现有的边辅助对象
        this.edgeHelpers.forEach(helper => {
            this.scene.remove(helper);
            helper.geometry.dispose();
            (helper.material as THREE.Material).dispose();
        });
        this.edgeHelpers = [];

        // 从 EdgesGeometry 中获取所有实际的边
        const edgesGeometry = new THREE.EdgesGeometry(this.geometry);
        const positions = edgesGeometry.attributes.position;

        // 为每条边创建辅助对象
        for (let i = 0; i < positions.count; i += 2) {
            const start = new THREE.Vector3(
                positions.getX(i),
                positions.getY(i),
                positions.getZ(i)
            );
            const end = new THREE.Vector3(
                positions.getX(i + 1),
                positions.getY(i + 1),
                positions.getZ(i + 1)
            );

            const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
            const length = start.distanceTo(end);

            const helper = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, length, 8),
                new THREE.MeshBasicMaterial({
                    color: 0x0000ff,
                    transparent: true,
                    opacity: 0.5,
                    depthTest: false
                })
            );

            helper.position.copy(midPoint);
            const direction = end.clone().sub(start).normalize();
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
            helper.setRotationFromQuaternion(quaternion);

            helper.userData.edge = { start, end };
            this.scene.add(helper);
            this.edgeHelpers.push(helper);
        }
    }

    private onMouseClick(event: MouseEvent): void {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 检查是否点击了顶点
        const vertexIntersects = this.raycaster.intersectObjects(this.vertexDots);
        if (vertexIntersects.length > 0) {
            const helper = vertexIntersects[0].object as THREE.Mesh;
            this.selectPoint(helper);
            return;
        }

        // 检查是否点击了边
        const edgeIntersects = this.raycaster.intersectObjects(this.edgeHelpers);
        if (edgeIntersects.length > 0) {
            const helper = edgeIntersects[0].object as THREE.Mesh;
            const edge = helper.userData.edge;
            if (edge) {
                this.selectEdge(edge);
                return;
            }
        }

        this.clearSelection();
    }

    private selectPoint(helper: THREE.Mesh): void {
        this.clearSelection();
        this.selectedPoint = helper.position.clone();
        this.transformControl.attach(helper);
    }

    private selectEdge(edge: { start: THREE.Vector3, end: THREE.Vector3 }): void {
        this.clearSelection();
        this.selectedEdge = edge;

        const midPoint = new THREE.Vector3().addVectors(edge.start, edge.end).multiplyScalar(0.5);
        const helper = new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        helper.position.copy(midPoint);
        this.scene.add(helper);
        this.transformControl.attach(helper);
    }

    private updateGeometry(): void {
        const helper = this.transformControl.object;
        if (!helper) return;

        if (this.selectedPoint) {
            const selectedIndex = (helper as THREE.Mesh).userData.index;
            const positions = this.geometry.attributes.position;
            
            // 获取选中顶点的原始位置
            const originalPosition = new THREE.Vector3(
                positions.getX(selectedIndex),
                positions.getY(selectedIndex),
                positions.getZ(selectedIndex)
            );

            // 获取新位置
            const worldPosition = new THREE.Vector3();
            helper.getWorldPosition(worldPosition);
            this.mesh.worldToLocal(worldPosition);

            // 更新所有共享相同位置的顶点
            for (let i = 0; i < positions.count; i++) {
                const vertex = new THREE.Vector3(
                    positions.getX(i),
                    positions.getY(i),
                    positions.getZ(i)
                );

                // 如果顶点位置与原始位置相同（考虑浮点数误差）
                if (vertex.distanceTo(originalPosition) < 0.0001) {
                    positions.setXYZ(i, worldPosition.x, worldPosition.y, worldPosition.z);
                }
            }

            positions.needsUpdate = true;
            this.geometry.computeVertexNormals();
        } else if (this.selectedEdge) {
            const worldPosition = new THREE.Vector3();
            helper.getWorldPosition(worldPosition);
            
            const midPoint = new THREE.Vector3()
                .addVectors(this.selectedEdge.start, this.selectedEdge.end)
                .multiplyScalar(0.5);
            const displacement = worldPosition.sub(midPoint);

            const positions = this.geometry.attributes.position;
            
            // 找到所有需要更新的顶点位置
            const startPositions: THREE.Vector3[] = [];
            const endPositions: THREE.Vector3[] = [];

            // 首先收集所有匹配的位置
            for (let i = 0; i < positions.count; i++) {
                const vertex = new THREE.Vector3(
                    positions.getX(i),
                    positions.getY(i),
                    positions.getZ(i)
                );

                if (vertex.distanceTo(this.selectedEdge.start) < 0.0001) {
                    startPositions.push(vertex.clone());
                }
                if (vertex.distanceTo(this.selectedEdge.end) < 0.0001) {
                    endPositions.push(vertex.clone());
                }
            }

            // 然后更新所有匹配的顶点
            for (let i = 0; i < positions.count; i++) {
                const vertex = new THREE.Vector3(
                    positions.getX(i),
                    positions.getY(i),
                    positions.getZ(i)
                );

                // 更新所有共享起点位置的顶点
                for (const startPos of startPositions) {
                    if (vertex.distanceTo(startPos) < 0.0001) {
                        vertex.add(displacement);
                        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
                        break;
                    }
                }

                // 更新所有共享终点位置的顶点
                for (const endPos of endPositions) {
                    if (vertex.distanceTo(endPos) < 0.0001) {
                        vertex.add(displacement);
                        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
                        break;
                    }
                }
            }

            positions.needsUpdate = true;
            this.geometry.computeVertexNormals();
        }

        this.scene.remove(helper);
        this.updateEdges();
        this.createVertexDots();
        this.createEdgeHelpers();
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.clearSelection();
        }
    }

    private clearSelection(): void {
        if (this.transformControl.object) {
            this.scene.remove(this.transformControl.object);
        }
        this.transformControl.detach();
        this.selectedPoint = null;
        this.selectedEdge = null;
        this.orbitControls.enabled = true;
    }
} 