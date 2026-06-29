import os
import glob

directory = r"c:\Users\wawos\Documents\농구\scoreboard\public\logos"
files = glob.glob(os.path.join(directory, "*.png"))

for f in files:
    dirname = os.path.dirname(f)
    basename = os.path.basename(f)
    
    # Shorten the name
    new_name = basename.replace("초등학교병설유치원", "유").replace("초등학교", "초").replace("중학교", "중").replace("고등학교", "고").replace("유치원", "유")
    
    if new_name != basename:
        new_path = os.path.join(dirname, new_name)
        # Handle case where shortened name already exists
        if not os.path.exists(new_path):
            os.rename(f, new_path)
            print(f"Renamed {basename} to {new_name}")
        else:
            # If exists, we can remove the old one if it's identical, or just skip
            pass
