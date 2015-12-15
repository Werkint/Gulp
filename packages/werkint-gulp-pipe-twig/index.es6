'use strict';
import Q from 'q';
import pipe from './pipe';

export default () => {
  return Q.promise(resolve => {
    resolve(config => {
      return pipe(config);
    });
  });
}
