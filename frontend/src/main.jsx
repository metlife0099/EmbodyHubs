import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import OnlineCare from './pages/OnlineCare';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';
import Account from './pages/Account';
import SupportChat from './pages/SupportChat';
import { ProfessionalApplication,ProfessionalsLanding } from './pages/Professionals';
import { Glossary, Learn, LearnArticle } from './pages/Learn';
import { About, Contact, HowItWorks, NotFound, Policy, SearchResults, Tracking } from './pages/InfoPages';
import Compare from './pages/Compare';
import { PartnerAccount,PartnershipApplication,PartnershipLanding,PartnershipVerification } from './pages/Partnerships';
import './styles.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><AppProvider><Layout><Routes>
  <Route path="/" element={<Home/>}/><Route path="/online-care" element={<OnlineCare/>}/><Route path="/shop" element={<Navigate replace to="/online-care"/>}/><Route path="/categories/:slug" element={<OnlineCare/>}/><Route path="/products/:slug" element={<ProductDetail/>}/><Route path="/search" element={<SearchResults/>}/><Route path="/cart" element={<Cart/>}/><Route path="/checkout" element={<Checkout/>}/>
  <Route path="/login" element={<Auth/>}/><Route path="/register" element={<Auth mode="register"/>}/><Route path="/forgot-password" element={<Auth mode="forgot"/>}/><Route path="/reset-password/:token" element={<Auth mode="forgot"/>}/><Route path="/account/*" element={<Account/>}/><Route path="/orders/*" element={<Account/>}/><Route path="/support/chat" element={<SupportChat/>}/>
  <Route path="/professionals" element={<ProfessionalsLanding/>}/><Route path="/professionals/apply" element={<ProfessionalApplication/>}/>
  <Route path="/partner-with-us" element={<PartnershipLanding/>}/><Route path="/partner-with-us/apply" element={<PartnershipApplication/>}/><Route path="/partner-with-us/verify" element={<PartnershipVerification/>}/><Route path="/partner-account" element={<PartnerAccount/>}/>
  <Route path="/how-it-works" element={<HowItWorks/>}/><Route path="/about" element={<About/>}/><Route path="/compare" element={<Compare/>}/><Route path="/learn" element={<Learn/>}/><Route path="/learn/glossary" element={<Glossary/>}/><Route path="/learn/:slug" element={<LearnArticle/>}/><Route path="/contact" element={<Contact/>}/><Route path="/tracking" element={<Tracking/>}/><Route path="/policies/:policy" element={<Policy/>}/><Route path="*" element={<NotFound/>}/>
</Routes></Layout></AppProvider></BrowserRouter></React.StrictMode>);
