import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('embody-cart') || '[]'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('embody-user') || 'null'));
  const [notice, setNotice] = useState(null);

  useEffect(() => localStorage.setItem('embody-cart', JSON.stringify(cart)), [cart]);
  useEffect(() => user ? localStorage.setItem('embody-user', JSON.stringify(user)) : localStorage.removeItem('embody-user'), [user]);
  useEffect(() => { if (!notice) return; const id = setTimeout(() => setNotice(null), 4200); return () => clearTimeout(id); }, [notice]);

  const addItem = (product) => {
    setCart(items => {
      const existing = items.find(item => item.id === product.id);
      return existing ? items.map(item => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item) : [...items, { ...product, quantity: 1 }];
    });
    setNotice({ type: 'success', message: `${product.name} added to your cart.` });
  };

  const requestAdd = (product) => product.prescriptionRequired ? setNotice({ type:'error', message:'Prescription ordering is unavailable until pharmacy licensing is configured.' }) : addItem(product);
  const updateQuantity = (id, quantity) => setCart(items => items.map(i => i.id === id ? { ...i, quantity: Math.max(1, Math.min(Number(quantity), i.stock)) } : i));
  const removeItem = id => setCart(items => items.filter(i => i.id !== id));
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = useMemo(() => ({ cart, user, setUser, notice, setNotice, addItem, requestAdd, updateQuantity, removeItem, count, subtotal }), [cart, user, notice, count, subtotal]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
