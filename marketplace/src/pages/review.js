import { Fragment, useRef, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import ReactStars from "react-rating-stars-component";
import { useRouter } from 'next/router';
import { create } from 'ipfs-http-client';
import Web3Modal from 'web3modal';
import { Contract, providers, utils } from "ethers";
import { collectibelMarketplaceAddress, marketplaceABI } from "../../../config";
import { ethers } from 'ethers';

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


export default function Example(props) {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
    // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  const [accountAddress, setAccountAddress] = useState(undefined)
  const [open, setOpen] = useState(true);
  const cancelButtonRef = useRef(null);
  const [formInput, updateFormInput] = useState('');
  const [rating, setRating] = useState();
  const router = useRouter();
  const data = router.query;
  const txHash = data.txHash;
  //const seller = data.seller;
  //const tokenId = data.tokenId;
  const itemId = data.itemId;
  console.log(data);
  console.log(data.txHash)

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

  // triggers whenever ratings changed in dialog
  const ratingChanged = (newRating) => {
    setRating(newRating)
    console.log(rating);

  };

  // function to upload data to IPFS and get url
  async function uploadData(){
    console.log(formInput)
    console.log(txHash)
    //console.log(seller)
    //console.log(tokenId)
    console.log(itemId)

    const jsonData = JSON.stringify({
      txHash, itemId, rating, formInput
    });
    console.log(jsonData)
    try{
      const added = await client.add(jsonData);
      const uri = `https://ipfs.io/ipfs/${added.path}`;
      console.log(uri)
      submitRating(uri)
    }catch(e){
      console.log(e);
    }
  }

  // provider or signer for transaction
  const getProviderOrSigner = async (needSigner = false) => {
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


  // submit rating create transaction
  async function submitRating(uri) {
    try{
      const signer = await getProviderOrSigner(true);
      // create an instance of marketplace contract
      let contract = new ethers.Contract(collectibelMarketplaceAddress, marketplaceABI, signer)
      // send transaction to set rating
      let transaction = await contract.setUserRatingAndReview(uri)
      console.log(transaction)
      let tx = await transaction.wait();
      console.log(tx)
      alert("Rating and Review submitted \n Transaction Hash : " + tx.transactionHash)
      router.push('/');
    }catch(error){
      console.log(error)
    }
  }
  
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        onClose={setOpen}
      >
        <div
          className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block
         sm:p-0"
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div
              className="inline-block align-bottom bg-white rounded-lg
               text-left 
            overflow-hidden shadow-xl 
            transform transition-all 
            sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div
                    className="mx-auto flex-shrink-0 flex items-center
                   justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0
                    sm:h-10 sm:w-10"
                  >
                    <h className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                      Transaction is successful
                    </Dialog.Title>
                    <div className="mt-2">
                    <ReactStars
                        count={5}
                        onChange={ratingChanged}
                        size={24}
                        activeColor="#ffd700"
                    />
                      <input className="text-sm text-gray-500" placeholder='leave a review' onChange={e => updateFormInput({ ...formInput, name: e.target.value })}>
                      </input>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md
                   border border-transparent shadow-sm px-4 py-2 bg-red-600
                    text-base font-medium text-white hover:bg-red-700 
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                     focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={uploadData}
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center
                  rounded-md border border-gray-300 shadow-sm px-4 py-2
                   bg-white text-base font-medium text-gray-700
                    hover:bg-gray-50 focus:outline-none focus:ring-2
                     focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0
                      sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setOpen(false)}
                  ref={cancelButtonRef}
                >
                  Cancel
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
