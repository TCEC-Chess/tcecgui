function splitPgnsString(text) {
   let arr = text.split(/((?:1-0|1\/2-1\/2|0-1)\n\n)/);
   let res = [];
   let j = 0;
   for (let i= 0; i < arr.length; i = i+2) {
      res[j++] = arr[i] + arr[i+1];
   }
   return res;
}
