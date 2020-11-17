import React, { useState, useEffect } from 'react'
import { UserOutlined, PayCircleOutlined, BankOutlined, SwapOutlined } from '@ant-design/icons'
import { Url, ContractAddr, Abi} from './ config'
import './App.css'
import Web3 from 'web3'

const web3 = new Web3(new Web3.providers.HttpProvider(Url))
const contractHandler = new web3.eth.Contract(Abi, ContractAddr)

const App = () => {
  const [minter, setMinter] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [op, setOp] = useState({
    opType: 'mint',
    field: 'to',
  })

  useEffect(() => {
    // 查询minter
    contractHandler.methods.minter().call({}, (err, res) => {
      err && console.log(`failed to get minter:${err}`)
      res && setMinter(res) 
    })
  }, [])

   return (
    <div className='app'> 
      <Accounts 
        minter={minter} 
        selectAccount={item => setSelectedAccount(item)} 
      />
      <Operations  
        op={op} 
        minter={minter}
        setOp={item => setOp(c => ({ ...c, ...item}))}
        selectedAccount={selectedAccount}
      />
    </div>
   )
}

const Accounts = props => {
  const { minter, selectAccount } = props
  const [accountList, setAccountList] = useState([])
  const [balances, setBalances] = useState([])
  const [cur, setCur] = useState(0)

  useEffect(() => {
    // 取所有账户
    // 用以太坊接口查询
    web3.eth.getAccounts().then(res => {
      setAccountList(res)
    }).catch(err => {
      console.log(`fail to get accountList:${err}`)
    })

    // 查询每个账户的余额
    // 用合约接口查询
    let promises = []
    accountList && accountList.forEach(el => {
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
  },[accountList])

  return (
    <div className='account-wrapper'>
      {
        accountList && accountList.map((el, idx) => (
          <div 
            key={el}  
            className={`account-row${el === minter ? ' minter': ''}${ cur === idx ? ' to' : '' }`}
            onClick={() => { selectAccount(el); setCur(idx) }}
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
  const { op, setOp, selectedAccount, minter } = props
  const { opType, field } = op
  const [accounts, setAccounts] = useState({
    from: '',
    to: '',
  })

  useEffect(() => {
    opType === 'mint' && accounts.from !== minter && setAccounts(c => ({...c, from: minter}))
    const obj = field === 'from' ? { from: selectedAccount } : { to: selectedAccount }
    setAccounts(c => ({...c, ...obj}))
  }, [selectedAccount])
 
  const eventProxy = e => {
    e.target && e.target.id && setOp({ field: e.target.id })
    if(e.target.id === 'submit') {
      switch(opType) {
        case 'mint':
          contractHandler.methods.mint(
            accounts.to,
            10
          ).send({ from: minter })
          .on('receipt', receipt => {
            console.log(`发币完成`, receipt)
            alert('发币成功')
          })
          break
        case 'send':
            contractHandler.methods.send(
              accounts.to,
              10
            ).send({ from: accounts.from })
            .then(receipt => {
              console.log('转账完成', receipt)
              alert('转账成功')
            })
          break
        default:
      }
    }
  }

  const toggleOp = op => {
    const resetAccounts = op === 'mint' ? { from: minter, to: '' } : { from: '', to: '' }
    const resetField = op === 'mint' ? { opType:op, field: 'to' } : { opType: op, field: 'from'}
    setOp(resetField)
    setAccounts(resetAccounts)
  }

  return (
    <div className='op-wrapper'>
      <div className='op-block' onClick={ e => eventProxy(e)}>
        <div className='op-header'>
          <div > {op.opType === 'mint' ? 
            (<span onClick={() => toggleOp('send')}><BankOutlined />  发币</span>) : 
            (<span onClick={() => toggleOp('mint')}><SwapOutlined />  转帐</span>)}
          </div> 
        </div>
        <div>
          <div id='from' className={`btn ${field === 'from' && 'btn-active'}`} >from</div>
          {accounts.from}
        </div>
        <div>
          <div id='to' className={`btn ${field === 'to' && 'btn-active'}`} >to</div>
          {accounts.to}
        </div>
        <div>
          <div className='btn' >amount</div>
          {10}
        </div>
        <div>
          <div id='submit' className={`btn ${field === 'submit' && 'btn-active'}`} >{ opType }</div>
        </div>
      </div>
    </div>
  )
}

export default App

