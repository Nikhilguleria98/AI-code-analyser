import { Children, createContext, useState } from "react";

export const ThemeContext=createContext

import React from 'react'

const ThemeProvider = ({children}) => {

    const [theme, setTheme]=useState("light")

    const toggleTheme=()=>{
        setTheme(prev=>(prev==="dark"?"light":"dark"))
    }
  return (
    <ThemeContext.Provider value={{theme, toggleTheme}}>
        <div className={`${theme==="dark"?"dark":""}`}>
        {children}

        </div>
        
      
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
