import subprocess
import os

folders = [
  {"id":"6660693101"},
  {"id":"6659855101"},
  {"id":"6660691101"},
  {"id":"6660692101"}
]


# 32645 WGS 84 / UTM zone 45N
# 4326 WGS 84, lat lon


i = 0
s_srs = '4326'
t_srs = '4326'
reSampleType = 'bilinear'
prePath = '/Users/dwood/projects/ice-melt/airbus_nepal/output'
project = 'large'
prefix = 'merge'

# 
path = f'{prePath}/{project}'

# make merge folder
try: 
  os.mkdir(f'{path}/merge')
except:
  pass

for folder in folders:
  print(folder['id'])
  
  inFiles = list()

  # get all .tif
  for file in os.listdir(f'{path}/{folder["id"]}'):
    # if i == 1:
    #     break;
    
    if file.endswith(".TIF"):
      # compile List by pushing item to list
      inFiles.append(f'{path}/{folder["id"]}/{file}')
      # i+=1
              
  # merge
  thisCall = f'/Applications/QGIS-LTR.app/Contents/MacOS/bin/gdal_merge.py -n 0 -ot Float32 -of GTiff -o {path}/merge/{folder["id"]}.TIF {" ".join(inFiles)} >> log.txt'

  print(thisCall)

  subprocess.call(thisCall, shell = True)

  thatCall = f'gdalwarp -s_srs EPSG:{s_srs} -t_srs EPSG:{t_srs} -srcnodata 0.0 -r {reSampleType} -of GTiff {path}/merge/{folder["id"]}.TIF {path}/merge/{folder["id"]}_nodata.TIF -overwrite >> log.txt'

  subprocess.call(thatCall, shell = True)

  # if i == 1:
  #   break;

