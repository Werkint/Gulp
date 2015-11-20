'use strict';
import Q from 'q';

export default app => Q.promise(resolve => {
  resolve(() => Q.promise((resolve, reject) => app.totalPipe
    .pipe(app.transform())
    .pipe(app.save())
    .on('end', resolve)
    .on('error', reject)));
});
