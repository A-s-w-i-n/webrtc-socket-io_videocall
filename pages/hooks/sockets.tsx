import { useEffect,useRef } from "react";

const Sockets = () => {
    const socketCreated =   useRef(false)

    useEffect(()=>{
        if(!socketCreated.current){
            const socketInitalizer = async ()=>{
                await fetch('/api/socket')
            }
            try {
                socketInitalizer()
                socketCreated.current =true
            } catch (error) {
                console.log("error : ",error);
            }
        }
    },[])
  return (
    <div>
      
    </div>
  )
}

export default Sockets
