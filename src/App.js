import { MdOutlineSwapVert} from 'react-icons/md';
import Swal from "sweetalert2";
import HashLoader from "react-spinners/HashLoader";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useDisconnect } from 'wagmi'
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/react'
import { useWeb3Modal } from '@web3modal/react'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { polygonMumbai, mainnet, polygon } from 'wagmi/chains'
import './App.css';
import connectContract, {contract} from './connectContract';
const chains = [polygonMumbai, mainnet, polygon]
const projectId = 'e5ee2dc4de76240fc63dcea932f9ad42'

//setup the wagmi config using walletconnect web3modal
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })])
const wagmiConfig = createConfig({
  autoConnect: false,
  connectors: w3mConnectors({ projectId, version: 1, chains }),
  publicClient
})

const ethereumClient = new EthereumClient(wagmiConfig, chains);
function App() {
  
  const { address, isConnected,isConnecting, isDisconnected } = useAccount()
  const { isOpen, open, close, setDefaultChain } = useWeb3Modal()
  const [value1, setValue1] = useState();
  const [value2, setValue2] = useState();
  const [totalEth, setTotalEth] = useState(0);
  const [chainId, setChainId] = useState();
  const [txnLoading, setTxnLoading] = useState(false);
  const [txDone, setTxDone] = useState(false);
  const [back,setBack] = useState(false);
  const [userToken, setUserToken] = useState('0.0');
  const [userEth, setUserEth] = useState('0.0');

  // connect smart contract with ui
  useEffect(() => {
    if (isConnected) {
      connectContract();
      console.log("connected");
    }
  },[isConnected])

  //get the total ether in the contract
  async function contractBalance() {
    try {
           console.log("contract balance");
         const eth = await contract.contractBalance();
         setTotalEth(eth.toString());
         console.log("total ether : ", eth.toString());
    } catch (error) {
         console.log("error : ", error);
    }
  }
  useEffect(()=>{
    if (isConnected) {
      contractBalance();
    }
  },[isConnected,chainId,txDone,address])
  


  //check the chain if it is mumbai testnet
  useEffect(() => {
    const {ethereum} = window;
    const checkChain = async() =>{
         const chainId = await ethereum.request({ method: 'eth_chainId' });
         setChainId(chainId);
         if(chainId!=="0x13881"){
              Swal.fire({
                   icon: "error",
                   title: "Wrong Network",
                   text: "Please connect to Mumbai Testnet",
              });
              
         }
    }
    if(isConnected)
    {checkChain();}
},[address])

  //Convert the eth into tokens 
  async function swapConvert(){
    let token
    try {

         token =  await contract.swapConvert((totalEth.toString()),(ethers.utils.parseEther(value1)));
         
        
    }catch (error) {
         console.log("error : ", error);
    }
    setValue2(token/10**18);
  }
  
  

  //Convert the tokens into eth
  async function swapBackConvert(){
    let eth;
    try{
      eth = await contract.swapBackConvert(ethers.utils.parseEther(value1))
    }catch(error){
      console.log("error : ", error);
    }
    setValue2(eth/10**18);
  }

  useEffect(()=>{
    if (isConnected) {
      if(!back){
        swapConvert();
      }
      else{
        swapBackConvert();
      }
    }
  },[value1])


  //handle the value for input 1
  function handleValue1(event){
    const newValue = event.target.value;
    setTxDone(!txDone);
    setValue1(newValue);
  }

  //handle the revert button between eth and tokens
  function handleBack(){
    setBack(!back);
    setTxDone(!txDone);
    setValue1(0);
    setValue2(0);
  }

  //swap the eth into tokens
  async function swap(){
    setTxnLoading(true);
    if(isConnected){
    if(chainId!=="0x13881"){
      setTxnLoading(false);
      Swal.fire({
           icon: "error",
           title: "Wrong Network",
           text: "Please connect to Mumbai Testnet",
      });
    }
    else{
      try {
        const tx = await contract.swap({value: ethers.utils.parseEther(value1)});
        await tx.wait();
        setTxnLoading(false);
        setTxDone(!txDone);
        Swal.fire({
          icon: "success",
          title: "Transaction Sucessful",
          text: `You got ${value1}ETH worth PONZU3`,
          footer: `<a href="https://mumbai.polygonscan.com/tx/${tx.hash}" target="_blank">Check the transaction hash on Ethersan</a>`,
        });
        console.log("tx : ", tx);
      } catch (error) {
        setTxnLoading(false);
        Swal.fire({
          icon: "error",
          title: "Transaction Failed",
          text: error.reason||error.data.message,
     });
        console.log("error : ", error);
      }
    }
  }
  else{
    setTxnLoading(false);
    Swal.fire({
      icon: "error",
      title: "Transaction Failed",
      text: "Please connect to Metamask",
    });
  }
  }

  //swap the tokens into eth
  async function swapBack(){
    console.log("value1",ethers.utils.parseEther(value1));
    setTxnLoading(true);
    if(isConnected){
    if(chainId!=="0x13881"){
      setTxnLoading(false);
      Swal.fire({
           icon: "error",
           title: "Wrong Network",
           text: "Please connect to Mumbai Testnet",
      });
    }
    else{
      try {
        const tx = await contract.swapBack(ethers.utils.parseEther(value1));
        await tx.wait();
        setTxnLoading(false);
        setTxDone(!txDone);
        Swal.fire({
          icon: "success",
          title: "Transaction Sucessful",
          text: `You got ${value2} ETH `,
          footer: `<a href="https://mumbai.polygonscan.com/tx/${tx.hash}" target="_blank">Check the transaction hash on Etherscan</a>`,
        });
        console.log("tx : ", tx);
      } catch (error) {
        setTxnLoading(false);
        Swal.fire({
          icon: "error",
          title: "Transaction Failed",
          text: error.reason||error.data.message,
     });
        console.log("error : ", error);
      }
    }
  }
  else{
    setTxnLoading(false);
    Swal.fire({
      icon: "error",
      title: "Transaction Failed",
      text: "Please connect to Metamask",
    });
  }
  }
  
  //Get users tokens details
  async function getUserTokens(){
    try{
      const userData = await contract.userTokenInfo(address)
      console.log("user data : ", userData[0].toString()/10**18, userData[1].toString()/10**18);
      setUserToken(userData[0].toString()/10**18);
      setUserEth(userData[1].toString()/10**18);
    }catch(error){
      console.log("error : ", error);
    }
  }
  useEffect(()=>{
    if(isConnected){
      getUserTokens();
    }
  },[isConnected,chainId,txDone, address])

  return (
    <div className="App">
      <div>
     
      <WagmiConfig config={wagmiConfig}>
      <div className="bg-bg-img bg-cover min-h-screen bg-no-repeat px-5 py-5 mix-blend-overlay">
      <div className="flex justify-between items-center flex-wrap gap-5 px-5  ">
        <div>
          <img
            src={process.env.PUBLIC_URL + "/images/images/logo.png"}
            className="max-w-[160px] w-full"
          />
        </div>
        <div>
          <button className="bg-yellow px-[3rem] py-2 border-orange rounded-lg border-4 ">
            <h1 className="text-xl font-bold" onClick={()=>open()} >{isConnected?`${address.substring(
                                     0,
                                     4
                                )}....${address.substring(
                                     address.length - 4,
                                     address.length
                                )}`:"Metamask"}</h1>
          </button>
        </div>
      </div>
      <div className="max-w-[400px] w-full mx-auto mt-10">
        <h1 className="text-center font-bold text-4xl text-white capitalize ">
          ETH POOL:
        </h1>
        <h1 className="text-center font-bold text-5xl text-white py-5 leading-8">
          {totalEth/10**18}
        </h1>
        <div className="justify-center flex flex-col mb-5 relative">
          <div className=" flex jsutify-between border-4 px-4  border-purple relative rounded-lg  w-full bg-white focus-0 mb-3  mx-auto py-1">
          <input
            type="text"
            value={value1}
            placeholder='0'
            onChange={(event) =>
              handleValue1(event)
            }
           className='max-w-[400px] w-full'
          />
 <p className='border border-4 rounded-lg border-purple px-1 font-bold min-w-[70px] text-center'>{back?"PONZU3":"ETH"}</p>
          </div>
         

         
          <div className="absolute top-[24%] left-[44%] z-50  bg-white">
           <MdOutlineSwapVert size={40} className="border-4 border-black  rounded-lg" onClick={handleBack}/>
          </div>
 
          <div className=" flex jsutify-between border-4 px-4  border-purple relative rounded-lg  w-full bg-white focus-0 mb-3  mx-auto py-1">
          <input
            type="text"
            value={value2}
            placeholder='0'
           className='max-w-[400px] w-full'
           readOnly={true}
          />
 <p className='border border-4 rounded-lg border-purple px-1  font-bold min-w-[70px] text-center'>{back?"ETH":"PONZU3"}</p>
          </div>
         
        </div>

        <div className="text-center">
          {txnLoading ?<div className='flex justify-center'><HashLoader
            color="#49FF88"
            loading = {txnLoading}
          /></div>:
          <div className='flex-direction-coloumn justify-center '>
          <button className="bg-green px-[4rem]  border-darkgreen  border-4 font-bold text-2xl py-2 rounded-lg my-3" onClick={back?swapBack:swap}> SWAP</button>
          
          </div>
          }
          </div>
        <p className="text-white  text-center py-4 text-3xl">
          Your PONZU3 is balance of {userToken} is now worth{" "}
          <span className="text-green font-bold">{userEth}  </span> Eth
        </p>
      </div>
    </div>
        
          
        </WagmiConfig>

        <Web3Modal 
          projectId={projectId} ethereumClient={ethereumClient} 
        />
        
      </div>
    </div>
  );
}

export default App;
