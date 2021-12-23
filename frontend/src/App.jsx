import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import { accessListify } from 'ethers/lib/utils'
import abi from './utils/WavePortal.json'

const Wave = ({ wave, index }) => {
  const [alpha] = useState((index * 1.5) / 100)

  const backgroundColor = `hsla(0, 0%, 0%, ${alpha})`

  return (
    <div
      key={`${wave.address}+${index}`}
      style={{
        backgroundColor,
        marginTop: '16px',
        padding: '8px',
      }}
    >
      <div>
        <span style={{ fontWeight: 'bold' }}>Address:</span>{' '}
        <a
          href={`https://rinkeby.etherscan.io/address/${wave.address}`}
          target="_blank"
        >
          {wave.address}
        </a>
      </div>
      <div>
        <span style={{ fontWeight: 'bold' }}>Time:</span>{' '}
        {wave.timestamp.toString()}
      </div>
      <div>
        <span style={{ fontWeight: 'bold' }}>Message:</span> {wave.message}
      </div>
    </div>
  )
}

export default function App() {
  const [currentAccount, setCurrentAccount] = useState('')
  const [message, setMessage] = useState('')
  const [allWaves, setAllWaves] = useState([])
  const [isMining, setIsMining] = useState(false)
  const [isSuccessful, setIsSuccessful] = useState(false)
  const [txnHash, setTxnHash] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const contractAddress = '0x8A9F825d782961678E71c811168478605F82e460'
  const contractABI = abi.abi

  const getAllWaves = async () => {
    try {
      const { ethereum } = window

      if (ethereum) {
        // TODO move this to a useEffect call, load on mount?
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        )

        const waves = await wavePortalContract.getAllWaves()

        setAllWaves(
          waves.map(({ waver, timestamp, message }) => ({
            address: waver,
            timestamp: new Date(timestamp * 1000),
            message,
          }))
        )
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    let wavePortalContract

    const handleNewWave = (address, timestamp, message) => {
      console.log('NewWave', address, timestamp, message)
      setAllWaves((prevState) => [
        ...prevState,
        {
          address,
          timestamp: new Date(timestamp * 1000),
          message,
        },
      ])
    }

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      )
      wavePortalContract.on('NewWave', handleNewWave)
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', handleNewWave)
      }
    }
  }, [])

  const wave = async () => {
    setErrorMsg('')

    try {
      const { ethereum } = window

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        )

        setIsMining(true)
        const waveTxn = await wavePortalContract.wave(message, {
          gasLimit: 300000,
        })
        console.log('Mining...', waveTxn.hash)

        await waveTxn.wait()
        console.log('Mined -- ', waveTxn.hash)

        const count = await wavePortalContract.getTotalWaves()
        console.log('Retrieved total wave count...', count.toNumber())
        setIsSuccessful(true)
        setTxnHash(waveTxn.hash)
        setIsMining(false)
        setMessage('')
      } else {
        console.warn('No ethereum')
      }
    } catch (err) {
      setErrorMsg(err.reason)
      console.error(err)
      setIsMining(false)
    }
  }

  const checkWalletConnection = async () => {
    try {
      const { ethereum } = window

      if (!ethereum) {
        console.warn('No metamask!')
        return
      } else {
        console.log("We've got it", ethereum)
      }

      const accts = await ethereum.request({ method: 'eth_accounts' })

      if (accts.length !== 0) {
        const acct = accts[0]
        console.log('Got account', acct)
        setCurrentAccount(acct)

        getAllWaves()
      } else {
        console.warn('No account found.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window

      if (!ethereum) {
        return
      }

      const accts = await ethereum.request({ method: 'eth_requestAccounts' })

      console.log('Connected', accts[0])
      setCurrentAccount(accts[0])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    checkWalletConnection()
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">👋 Hola!</div>

        <div className="bio">
          I'm Axel. Connect your Ethereum wallet and tell me about a nice
          interaction you had with a stranger! There's a very good chance I'll
          send you some free ETH if you sent a message!
        </div>
        {isMining ? (
          <div className="mining">Mining...</div>
        ) : isSuccessful ? (
          <div className="successful">
            Thanks for submitting. You can view your transaction @{' '}
            <a
              href={`https://rinkeby.etherscan.io/tx/${txnHash}`}
              target="_blank"
            >
              https://rinkeby.etherscan.io/tx/{txnHash}
            </a>
          </div>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(ev) => setMessage(ev.currentTarget.value)}
            />
            {!!errorMsg && <div className="error">{errorMsg}</div>}
            <button className="waveButton" onClick={wave}>
              Share Your Story
            </button>
          </>
        )}

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => (
          <Wave wave={wave} index={index} />
        ))}
      </div>
    </div>
  )
}
