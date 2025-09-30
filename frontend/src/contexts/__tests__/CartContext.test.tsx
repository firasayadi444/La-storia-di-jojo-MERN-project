import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCart } from '../CartContext'
import { mockFood } from '../../test/utils/test-utils'
import { vi } from 'vitest'

describe('CartContext', () => {
  it('provides initial cart state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.items).toEqual([])
    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPrice).toBe(0)
  })

  it('adds item to cart', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addToCart(mockFood, 2)
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toEqual({
      food: mockFood,
      quantity: 2,
    })
    expect(result.current.totalItems).toBe(2)
    expect(result.current.totalPrice).toBe(31.98) // 15.99 * 2
  })

  it('updates quantity of existing item', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    // Add item first
    act(() => {
      result.current.addToCart(mockFood, 2)
    })

    // Update quantity
    act(() => {
      result.current.updateQuantity(mockFood._id, 3)
    })

    expect(result.current.items[0].quantity).toBe(3)
    expect(result.current.totalItems).toBe(3)
    expect(result.current.totalPrice).toBe(47.97) // 15.99 * 3
  })

  it('removes item from cart', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    // Add item first
    act(() => {
      result.current.addToCart(mockFood, 2)
    })

    // Remove item
    act(() => {
      result.current.removeFromCart(mockFood._id)
    })

    expect(result.current.items).toHaveLength(0)
    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPrice).toBe(0)
  })

  it('clears entire cart', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    // Add items first
    act(() => {
      result.current.addToCart(mockFood, 2)
    })

    // Clear cart
    act(() => {
      result.current.clearCart()
    })

    expect(result.current.items).toHaveLength(0)
    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPrice).toBe(0)
  })
})
