import React, { useEffect, useState } from 'react';
import Swal from "sweetalert2";
import { contract } from '../connectContract';
import FadeLoader from "react-spinners/FadeLoader"
import RiseLoader from "react-spinners/RiseLoader";
const PopupModal = ({ onClose, account }) => {
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedIndex, setSelectedIndex] = useState();
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [count, setCount] = useState(0);
  const [itemList, setItemList] = useState([]);
  const [txn, setTxn] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isTxLoading, setIsTxLoading] = useState(false);

  const handleItemSelected = (item) => {
    setSelectedItem(item);
    setSelectedIndex(item.position);
    console.log("selected item : ", selectedIndex);
    setIsSubmitEnabled(true);
  };

  const fetchCount = async () => {
    try {
      const tx = await contract.txCount(account);
      console.log("count : ", tx.toNumber(), count);
      setCount(tx.toNumber());
      if(tx.toNumber()===0){
        setIsDataLoading(false);

      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    setIsDataLoading(true);
    fetchCount();
  }, [txn]);

  const fetchItem = async () => {
    const items = [];
    for (let i = 0; i < count; i++) {
      try {
        const item = await contract.userData(account, i);
        if (!item.swapBack) {
          console.log("item ", i, ": ", item[0].toString().substring(0, (item[0].toString()).length - 18));
          var timeStamp= item[2].toNumber()*1000;
          var date= new Date(timeStamp);
          const data = {
            position: i,
            token: item[0].toString().substring(0, (item[0].toString()).length - 18),
            date: date.toDateString()
          };
          items.push(data);
        }
        console.log("item ", i, ": ", item);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error in fetching data",
          text: err.reason,
        })
        console.log(err);
      }
    }
    setItemList(items);
    setIsDataLoading(false);
  };

  useEffect(() => {
    if (count > 0) {
      fetchItem();
    }
  }, [count,txn]);

  const handleSubmit = async() => {
    setIsTxLoading(true);
    try {
          const token = await contract.swapBack(selectedIndex);
          await token.wait();
          console.log("token : ", token);
          setIsTxLoading(false);
          setTxn(!txn);
    }catch (error) {
          setIsTxLoading(false);
          Swal.fire({
              icon: "error",
              title: "Transaction Failed",
              text: error.reason,
          });
         console.log("error : ", error);
    }
    
    setSelectedItem('');
    setIsSubmitEnabled(false);
  };
  
  return (
    <div className="fixed inset-0 w-500 flex items-center justify-center bg-opacity-75 bg-gray-900">
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Select the transaction:</h2>
        {isDataLoading ?
            <div >
            <RiseLoader 
            color="#a8b1c3"
            loading={isDataLoading}
            className="my-5 mx-auto"
            />
            </div>:
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">Txn No.</th>
              <th className="px-4 py-2">Token</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          
          <tbody>
            {itemList.map((item, index) => (
              <tr key={index}
                className={`cursor-pointer ${
                selectedItem === item ? 'text-white-500 bg-blue-500' : ''
              }`}
              onClick={() => handleItemSelected(item)}
              >
                <td className="px-4 py-2">{item.position+1}</td>
                <td className="px-4 py-2">{item.token}</td>
                <td className="px-4 py-2">{item.date}</td>
              </tr>
            ))}
          </tbody>
        
        </table>
        }
        {isTxLoading?
        <div className='flex justify-center'>
        <FadeLoader 
          />
          </div>:
        <div>
        <button
          disabled={!isSubmitEnabled}
          onClick={handleSubmit}
          className="m-4 bg-green border-darkgreen  border-4 hover:shadow-lg shadow-green text-black py-2 px-4 rounded"
        >
          Swap 
        </button>
        
        <button
          onClick={onClose}
          className="m-4  text-sm text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
        </div>
        }
      </div>
    </div>
  );
};

export default PopupModal;