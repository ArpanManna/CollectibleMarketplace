import styles from '../styles/Home.module.css'
import { useState, useEffect, useRef } from 'react';
import Web3Modal from 'web3modal';
import { Contract, providers, utils } from "ethers";
import { collectibelMarketplaceAddress, collectibleTokenAddress, collectibleTokenABI, marketplaceABI } from "../../../config";
import axios from "axios";
import { ethers } from 'ethers';
//import { modalCode } from './modal';
import { useRouter } from 'next/router';

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
    // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  const [accountAddress, setAccountAddress] = useState(undefined)
  const [collectibles, setCollectibles] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [formInput, updateFormInput] = useState('');
  const [amountToPurchase, updateAmountToPurchase] = useState('');
  const [curCollectible, updateCollectibleToBuy] = useState('');
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
    loadCollectibles()
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

  const loadCollectibles = async() => {
    try {
      const provider = await getProviderOrSigner();
      const marketplaceContract = new Contract(collectibelMarketplaceAddress, marketplaceABI, provider);
      const listedCollectibles = await marketplaceContract.getListedCollectibles();
      console.log('listedCollectibles',listedCollectibles)
      const collectibleContract = new Contract(collectibleTokenAddress, collectibleTokenABI, provider);
      const items = await Promise.all(listedCollectibles.map(async i => {
        let tokenURI = await collectibleContract.uri(i.tokenId);
        //console.log(tokenURI);
        const meta = await axios.get(tokenURI);
        //console.log('price : ', parseInt(i.price._hex))
        //let price = ethers.utils.formatUnits(i.price.toString(),'ether');
        //console.log(price)
        //console.log(parseInt(i.supply._hex))
        console.log('item Id: ', parseInt(i.itemid._hex))
        let item ={
          itemId: parseInt(i.itemid._hex),
          price: parseInt(i.price._hex),
          tokenId: i.tokenId,
          seller: i.owner,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
          supply: parseInt(i.supply._hex)
        };
        console.log(item)
        return item;
      }))
      //console.log('items',items)
      setCollectibles(items)
      //console.log('items after',items)
      setLoadingState('loaded')
    } catch(error) {
      console.log(error)
    }
  }

  async function buyCollectible(_itemId){
    console.log('amount',amountToPurchase)
    console.log('itemid',_itemId)
    try{
      const signer = await getProviderOrSigner(true);
      // create an instance of marketplace contract
      let contract = new ethers.Contract(collectibelMarketplaceAddress, marketplaceABI, signer)
      // purchase collectible
      //console.log(purchaseAmount)
      let transaction = await contract.buyCollectible(collectibleTokenAddress, _itemId, amountToPurchase)
      
      console.log(transaction)
      let tx = await transaction.wait();
      console.log(tx)
      alert("Purchase is successful \n Transaction Hash : " + tx.transactionHash)
         router.push({
        pathname: '/review',
        query: {
          txHash: tx.transactionHash,
          itemId: _itemId,
        }
      });
    }catch(error){
      console.log(error)
    }
  }

  async function buyCollectibleWithEther(_itemId, _price){
    console.log('amount',amountToPurchase)
    console.log('itemid',_itemId)
    try{
      const signer = await getProviderOrSigner(true);
      // create an instance of marketplace contract
      let contract = new ethers.Contract(collectibelMarketplaceAddress, marketplaceABI, signer)
      // purchase collectible
      let purchaseAmount = amountToPurchase*_price*0.0001;
      console.log(purchaseAmount)
      let transaction = await contract.buyCollectible(collectibleTokenAddress, _itemId, amountToPurchase, {value: ethers.utils.parseEther(purchaseAmount.toString())})
      
      console.log(transaction)
      let tx = await transaction.wait();
      console.log(tx)
      alert("Purchase is successful \n Transaction Hash : " + tx.transactionHash)
         router.push({
        pathname: '/review',
        query: {
          txHash: tx.transactionHash,
          itemId: _itemId,
        }
      });
    }catch(error){
      console.log(error)
    }
  }


  return (
    <div className={styles.container}>

      <div className='absolute right-20 w-[200px] overflow-hidden text-ellipsis'>
        {renderConnectButton()}
      </div>
      <div className='flex justify-center'>
    <div className='px-3 pt-20' style={{ maxWidth: '1600px' }}>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 pb-[112px]'>
        {
          collectibles.map( (collectible, i) => (
            <div key={i} className='border shadow rounded-xl overflow-hidden '>
              <img className='h-[400px] w-[350px] object-cover' src={collectible.image} />
              <div className='p-4'>
                <p style={{ height: '64px' }} className='text-2xl font-semibold'>
                  {collectible.name}
                </p>
                <div style={{ height: '70px', overflow: 'hidden'}}>
                  <p className='text-gray-400'>{collectible.description}</p>
                </div>
                <div style={{ height: '30px', overflow: 'hidden'}}>
                  <p className='text-cyan-900	 font-bold'>Supply : {collectible.supply}</p>
                </div>
              </div>
              <div className='p-4 bg-black'>
                <p className='text-2xl mb-4 font-bold text-white'>{collectible.price} OCEAN</p>
                <input placeholder='Amount' className='mt-5 border rounded py-2' onChange={p => updateAmountToPurchase(p.target.value)}></input>
                <button onClick={e => buyCollectible(collectible.itemId)} className='bg-yellow-600 text-white font-bold py-2 px-12 rounded'>Buy</button>
                <button onClick={e => buyCollectibleWithEther(collectible.itemId, collectible.price)} className='bg-yellow-600 text-white font-bold py-2 px-12 rounded'>Buy with Ether</button>
              </div>
            </div>
          ))
        }
      </div>        
    </div>
  </div>
      <footer className={styles.footer}>
        Made with &#10084; by Arpananya
      </footer>
    </div>
  )
}