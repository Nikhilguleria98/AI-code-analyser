import React, { useState } from 'react'

const Child2 = () => {
  const [task,settask] = useState([])
  const [input,setInput] = useState('')

  const addtask = ()=>{
    if(input.trim()==="") return;

    const newTask={
      id:Date.now(),
      text: input,
      completed:false
    }
    settask([...task,newTask])
    setInput("")
  }
  

  const toggleTask=(id)=>{
    settask(
      task.map((elem)=>elem.id ===id?{...elem,completed: !elem.completed}:elem)
    )
  }

  const deleteTask=(id)=>{
    settask(task.filter((elem)=>elem.id !==id))
  }
  return (
    <div>
      <input type="text" className='border' value={input} onChange={(e)=>setInput(e.target.value)}/>
      <button onClick={addtask}>add</button>

      <ul>
        {
          task.map((elem)=>(
            <li key={elem.id}>
              <span onClick={()=>toggleTask(elem.id)} className={`${elem.completed?"line-through":""}`}>{elem.text}</span><br />
              <button onClick={()=>deleteTask(elem.id)}>delete</button>
            </li>
          ))
        }
      </ul>
    </div>
  )
}

export default Child2
