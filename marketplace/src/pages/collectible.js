import { useState , useEffect, useRef} from 'react';
import { ethers } from 'ethers';
import { create } from 'ipfs-http-client';
import { useRouter } from 'next/router';
import Web3Modal from 'web3modal';
import { Contract, providers, utils } from "ethers";
import { collectibelMarketplaceAddress, collectibleTokenAddress, collectibleTokenABI, marketplaceABI } from "../../../config";



// setup ipfs

const projectId = '2Mrbv5oqANoJjqAaoTEiiiEorN4';
const projectSecret = '6afff0e67470daf86f28112c4bd4123a';
const auth =
    'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
});


export default function createCollectible(){
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  const [accountAddress, setAccountAddress] = useState(undefined)
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({name: '', description: '', supply: ''});
  const [formInputListing, updateFormInputListing] = useState({tokenId: '', amount: '', price: ''});
  //const [mintedNFTtx, setMintedNFTtx] = useState(undefined)
  const router = useRouter()

  useEffect(() => {
    if(!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "sepolia",
        providerOptions: {},
        disableInjectedProvider: false,
      })
    }
  }, [walletConnected])

  async function onChange(e) {
    const file = e.target.files[0];
    try{
      const added = await client.add( 
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`) 
        }
      );
        const url = `https://ipfs.io/ipfs/${added.path}`;
        console.log(url)
        setFileUrl(url);      
        }catch(error){
        console.log(error);
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const accounts = await web3Provider.listAccounts()
    //console.log(accounts[0])
    setAccountAddress(accounts[0])  
    // If user is not connected to the Sepolia testnet, throw an error
    const { chainId } = await web3Provider.getNetwork();
    // Sepolia testnet chain id = 11155111
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

  async function uploadData(){
    const { name, description, supply } = formInput;
    if( !name || !description || !supply || !fileUrl ) return;
    console.log(name, description, supply, fileUrl)
    const data = JSON.stringify({
      name, description, supply, image: fileUrl
    });
    try{
      const added = await client.add(data);
      const uri = `https://ipfs.io/ipfs/${added.path}`;
      console.log(uri)
      createCollectible(supply, uri)
    }catch(e){
      console.log(e);
    }
  }

  async function createCollectible(supply, uri) {
    try{
      const signer = await getProviderOrSigner(true);
      // create an instance of CollectibleToken contract
      let contract = new ethers.Contract(collectibleTokenAddress, collectibleTokenABI, signer)
      // mint collectible
      let transaction = await contract.createCollectible(supply, uri)
      console.log(transaction)
      let tx = await transaction.wait();
      console.log(tx)
      alert("Collectible created \n Transaction Hash : " + tx.transactionHash)
    }catch(error){
      console.log(error)
    }
  }

  async function listCollectible(){
    const { tokenId, amount, price } = formInputListing;
    if( !tokenId || !amount || !price) return;
    console.log(tokenId, amount, price)
    try{
        const signer = await getProviderOrSigner(true);
        // create an instance of Marketplace contract
        let contract = new ethers.Contract(collectibelMarketplaceAddress, marketplaceABI, signer)
        // list collectible
        let transaction = await contract.listCollectible(collectibleTokenAddress, tokenId, price, amount)
        let tx = await transaction.wait()
        console.log(tx)
        alert("Listing is successful \n Transaction Hash : " + tx.transactionHash)
        router.push('/');
    }catch(error){
        console.log(error)
    }
  }

  return (
      <div className='flex justify-center'>
        <div className='w-1/2 flex flex-col pb-12'>
          <input placeholder='Name' className='mt-8 border rounded p-4' onChange={e => updateFormInput({ ...formInput, name: e.target.value })}/>
          <textarea placeholder='Description' className='mt-8 border rounded p-4' onChange={e => updateFormInput({ ...formInput, description: e.target.value })}/>
          <textarea placeholder='Supply' className='mt-8 border rounded p-4' onChange={e => updateFormInput({ ...formInput, supply: e.target.value })}/>
          <input type='file' name='Asset' className='my-4' onChange={onChange}/>
          {
            fileUrl && (
              <img className='rounded mt-4 ' width='350' src={fileUrl}  />
            )
          }
          <button onClick={uploadData} className='font-bold mt-4 bg-yellow-500 text-white rounded p-4 shadow-lg'>Create</button>
          
          <textarea placeholder='Token ID' className='mt-8 border rounded p-4' onChange={l => updateFormInputListing({ ...formInputListing, tokenId: l.target.value })}/>
          <textarea placeholder='Amount to list' className='mt-8 border rounded p-4' onChange={l => updateFormInputListing({ ...formInputListing, amount: l.target.value })}/>
          <textarea placeholder='Price (OCEAN Token)' className='mt-8 border rounded p-4' onChange={l => updateFormInputListing({ ...formInputListing, price: l.target.value })}/>
          <button onClick={listCollectible} className='font-bold mt-4 bg-yellow-500 text-white rounded p-4 shadow-lg'>List</button>
        </div>
      </div>
  )
}