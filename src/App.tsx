import { useState, useEffect } from 'react'
import CountMap from './components/CountMap'
import HelpRequestPost from './components/HelpRequestPost'
import './App.css'
import supabase from './supabase-client'

function App() {


  return (
    <>
      <CountMap />
      <HelpRequestPost />
    </>
  )
}

export default App
