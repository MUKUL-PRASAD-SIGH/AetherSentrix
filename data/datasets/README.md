# Dataset Drop Zone

Put local cybersecurity CSV datasets in this folder.

Recommended examples:

- `cicids2017_*.csv`
- `unsw_nb15_*.csv`
- `nsl_kdd_*.csv`
- your own preprocessed export with a label column

The app discovers these files through `/ml/status` and the React `Models` tab.

After adding a file:

1. start `python api.py`
2. open the website
3. go to `Models`
4. choose `real`
5. train and activate
