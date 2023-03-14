import subprocess
import os

# 32645 WGS 84 / UTM zone 45N
# 4326 WGS 84, lat lon

folders = [
  {"id":"6660693101","s_srs":"4326"},
  {"id":"6659855101","s_srs":"32645"},
  {"id":"6660691101","s_srs":"4326"},
  {"id":"6660692101","s_srs":"4326"}
]

i = 0
# s_srs = '4326'
t_srs = '4326'
reSampleType = 'bilinear'
prePath = '/Users/dwood/projects/ice-melt/airbus_nepal'
resolution = '1e-05 1e-05'
prefix = 'resize'
# -te 86.180020794 27.605527881 86.776844382 28.054891126
# extent = '419084.3049,477979.5759,3053643.4320,3103553.3830'

for folder in folders:
  # for y in folder:

  print(folder)
  path = '''{}/IMG_PHR1B_PMS_001'''.format(folder["id"])

  try: 
    os.mkdir('''output/{}'''.format(folder["id"]))
  except:
    pass

  # get all .tif
  for file in os.listdir(path):
    # if i == 1:
    #     break;

    if file.endswith(".TIF"):
      # Prints tif
      print(file)
      i+=1

      # down sample    
      print(file)
      thisCall = f'gdalwarp -s_srs EPSG:{folder["s_srs"]} -t_srs EPSG:{t_srs} -srcnodata 0.0 -r {reSampleType} -tr {resolution} -of GTiff {prePath}/{folder["id"]}/IMG_PHR1B_PMS_001/{file} {prePath}/output/{folder["id"]}/{prefix}_{file} -overwrite >> log.txt'

      print(thisCall)
      subprocess.call(thisCall, shell = True)      

      # if i == 1:
      #   break;

