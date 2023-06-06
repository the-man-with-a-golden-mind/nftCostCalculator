"use client"
import { useEffect, useState } from 'react'
import { BigNumber, ethers } from 'ethers'
export default function Home() {
  const erc721ABI = ['function mint(address receiver, uint256 id, uint256 amount)']
  const erc1155ABI = ['function mintBatch(address receiver, uint256[] ids, uint256[] amounts)']
  const erc721AABI = ['function mint(address receiver, uint256 id)']
  const [address, setAddress] = useState("")
  const [count, setCount] = useState(0)
  const [standard, setStandard] = useState("ERC1155")
  const [isDisabled, setIsDisabled] = useState(true)
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>()
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>()
  const [wallet, setWallet] = useState("")
  const [errMessage, setErrMessage] = useState<any>("")
  const [network, setNetwork] = useState<string | undefined>("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [connect, setConnect] = useState(false)
  const [gasCost, setGasCost] = useState<BigNumber | undefined>()
  const [cost, setCost] = useState(0)
  const ethPriceAPI = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  const gasPriceAPI = "https://coherent.space/api/gas"


  const isChecked = (_standard: string) => {
    return standard === _standard
  }

  const mint = async () => {
    try {
      if (standard === "ERC1155") {
        const contract = new ethers.Contract(address, erc1155ABI, signer)
        const amounts = Array(count).fill(1);
        const ids = Array.from({ length: count }, () => Math.floor(Math.random() * 10000000) + 1);

        const mintFunction = await contract.mintBatch(address, ids, amounts)
        const hex = mintFunction.hash
        const gasCost = await provider?.waitForTransaction(hex)
        setGasCost(gasCost?.gasUsed)
      } else if (standard === "ERC721") {
        const contract = new ethers.Contract(address, erc721ABI, signer)
        const mintFunction = await contract.mint(address, Math.floor(Math.random() * 100000000), 10)
        const hex = mintFunction.hash
        const gasCost = await provider?.waitForTransaction(hex)
        setGasCost(gasCost?.gasUsed)
      } else if (standard === "ERC721A") {

        const contract = new ethers.Contract(address, erc721AABI, signer)
        const mintFunction = await contract.mint(address, count)
        const hex = mintFunction.hash
        const gasCost = await provider?.waitForTransaction(hex)
        setGasCost(gasCost?.gasUsed)
      }
    } catch (error) {
      console.log(error)
      window.setTimeout(() => { setErrMessage("") }, 5000)
      setErrMessage(error)
    }
  }





  useEffect(() => {
    const getEthPrice = async () => {
      const result = await (await fetch(ethPriceAPI)).json()
      const ethPrice = result.ethereum.usd
      return ethPrice
    }

    const getGasPrice = async () => {
      const result = await (await fetch(gasPriceAPI)).json()
      const gasPriceString = result.result
      const gasPrice = parseInt(gasPriceString, 16)
      return gasPrice
    }

    const cummulatedCost = async () => {
      if (gasCost !== undefined) {
        const gasPrice = await getGasPrice()
        const ethPrice = await getEthPrice()
        let result = gasCost.toNumber() * gasPrice * Math.pow(10, -18) * ethPrice
        if (standard === "ERC721") {
          result = result * count
        }
        setCost(result)
      }
      return 0
    }
    if (gasCost !== undefined) {
      cummulatedCost()
    }
  }, [gasCost, count, standard])

  const connectWallet = async () => {
    // await getGasPrice()
    try {
      //@ts-ignore
      if (window.ethereum == null) {
        console.log("MetaMask not installed; using read-only defaults")
        //@ts-ignore
        setProvider(ethers.getDefaultProvider())
      } else {
        //@ts-ignore
        const _provider = new ethers.providers.Web3Provider(window.ethereum)
        console.log(_provider)
        setProvider(_provider)

        //@ts-ignore
        const _signer = _provider.getSigner()
        setSigner(_signer);
        if (wallet == "") {
          if (_provider !== undefined && _signer !== undefined) {
            await _provider.send("eth_requestAccounts", [])
            const network = await _provider.getNetwork()
            setNetwork(network.name)
            const _wallet = await _signer.getAddress()
            setWallet(_wallet)
          }
        }
      }
      setConnect(true)
      setIsConnecting(false)
    } catch (error) {
      window.setTimeout(() => { setErrMessage("") }, 5000)
      setErrMessage(error)
      setIsConnecting(false)
      console.log(error)
      setConnect(false)
    }
  }

  useEffect(() => {

    const checkIfDisabled = () => {
      if (address != "" && count > 0 && !Number.isNaN(count)) {
        setIsDisabled(false)
      } else {
        setIsDisabled(true)
      }
    }
    checkIfDisabled()

  }, [address, count])




  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-10">
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-xl flex flex-col w-full">
            <h1 className="text-5xl text-primary font-bold mb-5">NFT COST SIMULATION</h1>
            {!connect
              ? <button className="btn btn-primary mt-5 w-56 self-center" onClick={() => connectWallet()}>CONNECT</button>
              :
              <div>
                <h2 className="text text-accent">{wallet} ({network})</h2>
                <input onChange={(elem) => {
                  setAddress(elem.target.value)
                }} itemType="text" placeholder="Contract Address" className="input input-bordered input-primary w-full self-center mt-5 text-black" />
                <input onChange={(elem) => setCount(parseInt(elem.target.value))} itemType="text" placeholder="Amount" className="input input-bordered w-full self-center mt-5 text-black" />
                <div className="flex flex-row justify-around mt-5">
                  <div className="flex items-center align-middle">
                    <label className="label text-primary">
                      ERC1155
                    </label>
                    <input onClick={() => {
                      setGasCost(undefined)
                      setStandard("ERC1155")
                    }} type="radio" name="radio-3" className="radio radio-secondary ml-3" checked={isChecked("ERC1155")} />
                  </div>
                  <div className="flex items-center align-middle">
                    <label className="label text-primary">
                      ERC721
                    </label>
                    <input onClick={() => {
                      setGasCost(undefined)

                      setStandard("ERC721")
                    }} type="radio" name="radio-3" className="radio radio-secondary ml-3" checked={isChecked("ERC721")} />
                  </div>
                  <div className="flex items-center align-middle">
                    <label className="label text-primary">
                      ERC721A
                    </label>
                    <input onClick={() => {
                      setGasCost(undefined)

                      setStandard("ERC721A")
                    }} type="radio" name="radio-3" className="radio radio-secondary ml-3" checked={isChecked("ERC721A")} />
                  </div>
                </div>
                <button onClick={() => mint()} className="btn btn-primary mt-5 w-56 self-center" disabled={isDisabled}>Start</button>
                {gasCost !== undefined ?
                  <div className="flex flex-col">
                    <h1 className="mt-5 text-primary">ESTIMATED COST:</h1>
                    {cost === 0 ?
                      <progress className="progress w-56"></progress>
                      : <h1 className="mt-3 text-xl text-success fold-bold">{cost.toFixed(2)} USD</h1>}

                  </div>
                  : null}
              </div>
            }

          </div>
        </div>
      </div>
      {errMessage !== "" ?
        < div className="toast">
          <div className="alert alert-error">
            <span>There is an error. Check console. It is looong.</span>
          </div>
        </div> : null}
    </main>
  )
}
