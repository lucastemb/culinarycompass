import React from 'react';

const Chart = (props) => {
  return (
    <div className="bg-white">
      <h1 className="font-bold text-xl opacity-100"> {props.algorithm} </h1>
      <div className="overflow-auto h-[18rem]">
      <h2 className="font-bold"> Order to Visit: </h2>
      <ul>
        {props.tour && props.tour.map((restaurant, index)=> {
          return <li key={index}>{index+1}: {restaurant}</li>
        })}
      </ul>
      </div>
      <p> <span className="font-bold"> Time: </span> {props.time} ms </p>
      <p> <span className="font-bold"> Total Distance: </span> {props.distance}  km  </p>
    </div>
  );
};

export default Chart;