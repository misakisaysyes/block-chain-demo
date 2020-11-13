pragma solidity >=0.4.22 <0.7.0;

contract coin {
    address public minter;
    mapping(address => uint) public balances;
    
    event Sent(address from, address to, uint amount);
    
    constructor() public {
        minter = msg.sender;
    }
    
    function mint(address receiver, uint amount) public {
        require(minter == msg.sender);
        balances[receiver] += amount;
    }
    
    function send(address receiver, uint amount) public {
        require(amount < balances[msg.sender]);
        balances[msg.sender] -= amount;
        balances[receiver] += amount;
        emit Sent(msg.sender, receiver, amount);
    }
}