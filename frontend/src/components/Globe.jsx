import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { useEffect, useState, useRef } from 'react'
import * as THREE from 'three'

function GlobeMesh({ geoData }) {
  const ref = useRef()
  const temp = new THREE.Object3D()

  const points = []

  geoData.features.forEach((feature) => {
    const { coordinates, type } = feature.geometry
    const polygons =
      type === 'Polygon'
        ? [coordinates]
        : type === 'MultiPolygon'
        ? coordinates
        : []

    polygons.flat().forEach((ring) => {
      ring.forEach(([lon, lat]) => {
        const phi = (90 - lat) * (Math.PI / 180)
        const theta = (lon + 180) * (Math.PI / 180)
        const x = Math.sin(phi) * Math.cos(theta) * 2
        const y = Math.cos(phi) * 2
        const z = Math.sin(phi) * Math.sin(theta) * 2
        points.push([x, y, z])
      })
    })
  })

  useEffect(() => {
    points.forEach((pos, i) => {
      temp.position.set(...pos)
      temp.updateMatrix()
      ref.current.setMatrixAt(i, temp.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [points])

  return (
    <instancedMesh ref={ref} args={[null, null, points.length]}>
      <sphereGeometry args={[0.03, 6, 6]} />
      <meshStandardMaterial color="#ff6b00" emissive="#ff6b00" emissiveIntensity={1.5} />
    </instancedMesh>
  )
}

export default function Globe() {
  const [geoData, setGeoData] = useState(null)

  useEffect(() => {
    fetch('/data/countries.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error(err))
  }, [])

  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <OrbitControls enableZoom={true} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={2} />
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.6} />
      </mesh>
      {geoData && <GlobeMesh geoData={geoData} />}
    </Canvas>
  )
}
