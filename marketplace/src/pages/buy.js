import styles from '../styles/Home.module.css'
import { useState, useEffect, useRef } from 'react';
import Web3Modal from 'web3modal';
import { Contract, providers, utils } from "ethers";
import { collectibelMarketplaceAddress, collectibleTokenAddress, collectibleTokenABI, marketplaceABI } from "../../../config";
import { ethers } from 'ethers';
import { useRouter } from 'next/router';

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
    // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  const [accountAddress, setAccountAddress] = useState(undefined)
  const [formInput, updateFormInput] = useState('');
  const router = useRouter()
  
  useEffect(() => {
    if(!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "sepolia",
        providerOptions: {},
        disableInjectedProvider: false,
      })
    }
    connectWallet()
  }, [walletConnected])

  const connectWallet = async () => {
    try{
      await getProviderOrSigner()
      setWalletConnected(true)
    }catch(error) {
      console.log(error)
    }
  }
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    console.log(provider)
    const web3Provider = new providers.Web3Provider(provider)
    console.log(web3Provider)
    const accounts = await web3Provider.listAccounts()
    console.log(accounts[0])
    setAccountAddress(accounts[0])  
    // If user is not connected to the Sepolia network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 11155111) {
      window.alert("Change the network to Sepolia");
      throw new Error("Change network to Sepolia");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  const renderConnectButton = () => {
    if(!walletConnected){
      return(
        <button onClick={connectWallet} className={styles.button}>Connect Wallet</button>
      )
    }
    return (
      <div className='truncate'>Connected to {accountAddress}</div>
    )
  }



  async function buyToken(){
    let amountToPurchase = formInput;
    console.log(amountToPurchase)
    try{
      const signer = await getProviderOrSigner(true);
      // create an instance of CollectibleToken contract
      let contract = new ethers.Contract(collectibleTokenAddress, collectibleTokenABI, signer)
      // purchase token
      let purchaseAmount = amountToPurchase*0.0001;
      console.log(purchaseAmount)
      let transaction = await contract.buyOceanToken(amountToPurchase, {value: ethers.utils.parseEther(purchaseAmount.toString())})
      
      console.log(transaction)
      let tx = await transaction.wait();
      console.log(tx)
      console.log(tx.transactionHash)
      alert("Buy successful \n Hash : " + tx.transactionHash)
      router.push('/');
    }catch(error){
      console.log(error)
    }
  }




  return (
    <div className='flex justify-center'>

        <p className='pt-10'>1 OCEAN = 0.0001 ether</p>
      <div className='w-2 flex pt-20 pb-10 px-10'>
        
        <div>
          <input placeholder='Amount' className='mt-8 border rounded p-4' onChange={a => updateFormInput(a.target.value)}></input>
          <button onClick={buyToken} className='font-bold mt-4 bg-yellow-500 text-white rounded p-4 shadow-lg'>BUY OCEAN</button>
        </div>
      </div>
     
  
    
      <footer className={styles.footer}>
        Made with &#10084; by Arpananya
      </footer>
    </div>
  )
}