import React, { useEffect, useState } from 'react'

const ProductList = () => {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch('/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Error al obtener productos:', err))
  }, [])

  return (
    <div>
      <h2>Lista de productos</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <strong>{product.name}</strong> – ${product.price}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ProductList