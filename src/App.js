import React, { useState, useEffect, useContext } from 'react'
import { UserOutlined, PayCircleOutlined, BankOutlined, SwapOutlined } from '@ant-design/icons'
import { Url, ContractAddr, Abi} from './ config'
import './App.css'
import Web3 from 'web3'

const web3 = new Web3(new Web3.providers.HttpProvider(Url))
const contractHandler = new web3.eth.Contract(Abi, ContractAddr)
let Ctx = React.createContext(null)

const App = () => {
  const [accounts, setAccounts] = useState(null)
  const [cur, setCur] = useState(0)
  const [minter, setMinter] = useState('')
  const [op, setOp] = useState('mint')

  useEffect(()=>{
    web3.eth.getAccounts().then(res => {
      setAccounts(res)
    }).catch(err => {
      console.log(`fail to get accounts:${err}`)
    })

    /* egcall */
    contractHandler.methods.minter().call({}, (err, res) => {
      err && console.log(`failed to get minter:${err}`)
      res && setMinter(res)
    })
  }, [])

  return (
    <div className='app'> 
      <Ctx.Provider value={{ accounts, cur, op, minter }}>
        <Accounts setCur={ cur => setCur(cur) }/>
        <Operations setOp={ op => setOp(op) }/>
      </Ctx.Provider> 
    </div>
  )
}

const Accounts = props => {
  const { setCur } = props
  const { accounts, cur, minter, op } = useContext(Ctx)
  const [balances, setBalances] = useState([])
  
  useEffect(() => {
    let promises = []
    accounts && accounts.forEach(el => {
      const p = new Promise((resolve, reject) => 
        contractHandler.methods.balances(el).call({}, (err, res) => {
          resolve(res)
          reject(`failed to get minter(${el})'s balance:${err}`)
        })
      )
      promises.push(p)
    })
    Promise.allSettled(promises).then(res => {
      setBalances(res.filter(el => el.status === 'fulfilled').map(el => el.value ? el.value : 0))
    })
  }, [accounts, minter, op])

  return (
    <div className='account-wrapper'>
      {
        accounts && accounts.map((el, idx) => (
          <div 
            key={el}  
            className={`account-row${el === minter ? ' minter': ''}${idx === cur ? ' to' : '' }`}
            onClick={() => setCur(idx)} 
          >
            <div> <UserOutlined /> {`  ${el}`} </div>
            <div> <PayCircleOutlined /> {`  ${balances[idx]}`} </div>
          </div>
        ))
      }
    </div>
  )
}

const Operations = props => {
  const { setOp } = props
  const { op } = useContext(Ctx)
  return (
    <div className='op-wrapper'>
      { /mint/.test(op) && <OpBlock  
        onClick={_op => setOp(_op)}
      />}
      { op === 'transfer' && <OpBlock  
        onClick={() => setOp('mint')}
      />}
    </div>
  )
}

const OpBlock = props => {
  const { accounts, cur, op, minter } = useContext(Ctx)

  const mint = () => {
    /* egsend */
    contractHandler.methods.mint(
      accounts[cur],
      10
    ).send({ from: minter })
    .on('transactionHash', hash => {
      console.log(`查看transactionHash`, hash)
    })
    .on('receipt', receipt => {
      console.log(`查看receipt$`, receipt)
      props.onClick(`${op}-${cur + 1}`)
      alert('发币成功')
    })
  }

  return (
    <div className='op-block' >
      <div className='op-header'>
        { /mint/.test(op) ? <div><BankOutlined />{' 发币'}</div> : <div><SwapOutlined />{' 转帐'}</div> }
      </div>
      <div>
        <div className='btn'>from</div>
        { minter }
      </div>
      <div>
        <div className='btn'>to</div>
        { accounts && accounts[cur] }
      </div>
      <div>
        <div className='btn'>amount</div>
        {'10'}
      </div>
      <div>
        <div className='btn' onClick={() => {mint()}}>mint</div>
      </div>
  </div>
  )
}

// const originRef = () => {
//   const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
  
//   web3.eth.getAccounts().then(res => {
//     console.log('获取账户', res)
//   })

//   console.log('查看web3.eth', web3.eth)

//   const contractHandler = new web3.eth.Contract(abi, '0x74fcacced25c52520df07cd280cee3c116a62013')
//   console.log('查看合约句柄', contractHandler)

//   contractHandler.methods.minter().call({
//     from: '0x116173eb2001B80e65Ce452983286fd9fCce2916'
//   }, (err, res) => {
//     err && console.log('查看minter失败', err)
//     res && console.log('minter：', res)
//   })

//   contractHandler.methods.mint(
//     '0xb0036A897EabF7BeB551f93A06dC7D91Dcf5C97B',
//     100
//   ).call({
//     from: '0x116173eb2001B80e65Ce452983286fd9fCce2916',
//     gasPrice: '1',
//     gas: 9999999999,
//   }, (err, res) => {
//     err && console.log('发布失败', err)
//     res && console.log('发币成功', res)
//   })

//   contractHandler.methods.mint(
//     '0xb0036A897EabF7BeB551f93A06dC7D91Dcf5C97B',
//     1
//   ).send({ from: '0x116173eb2001B80e65Ce452983286fd9fCce2916'})
//   .on('transactionHash', hash => {
//     console.log('查看transactionHash', hash)
//   })
//   // .on('receipt', receipt => {
//   //   console.log('查看receipt', receipt)
//   // })
//   // .on('confirmation', (confirmationNumber, receipt) => {
//   //   console.log('查看confirmation', confirmationNumber, receipt)
//   // })
//   // .on('error', (error, receipt) => {
//   //   console.log('查看error', error, receipt)
//   // })

//   contractHandler.methods.balances('0xb0036A897EabF7BeB551f93A06dC7D91Dcf5C97B').call({
//     from: '0x116173eb2001B80e65Ce452983286fd9fCce2916',
//   }, (err, res) => {
//     err && console.log('看余额失败', err)
//     res && console.log('看余额成功', res)
//   })

//   contractHandler.methods.send(
//     '0x116173eb2001B80e65Ce452983286fd9fCce2916',
//     10
//   ).send({from: '0xb0036A897EabF7BeB551f93A06dC7D91Dcf5C97B'}).then(
//     receipt => {
//       console.log('转账完成', receipt)
//     }
//   )

//   contractHandler.methods.balances('0x116173eb2001B80e65Ce452983286fd9fCce2916').call({
//     from: '0xb0036A897EabF7BeB551f93A06dC7D91Dcf5C97B',
//   }, (err, res) => {
//     err && console.log('查看矿工余额失败', err)
//     res && console.log('查看矿工余额成功', res)
//   })

//   return (
//     <div> 
//       this is test web3
//     </div>
//   );
// }

export default App
