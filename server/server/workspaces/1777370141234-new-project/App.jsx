// import React, { createContext, useState } from 'react'
// import ChildA from './Context/ChildA'
// import Preloader from './Loader'

// const ThemeContext = createContext()
// const App = () => {

//     const [theme , setTheme] = useState('light')

//   return (
//     <>
// {/* <ThemeContext.Provider value={{theme , setTheme} }>
//    <div className={`border-2 border-black h-96 w-96 flex items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
//    <ChildA/>
//    </div>
// </ThemeContext.Provider> */}
// <Preloader/>
//     </>
//   )
// }

// export default App
// export {ThemeContext}

import React from 'react'
import Parent from './Parent'
import LoginToggle from './Parent'
import ParentComponent from './Parent'
import Pracrice from './Pracrice'
import Child2 from './Child2'



const App = () => {
  return (
  
      <Child2/>
   
  )
}

export default App
