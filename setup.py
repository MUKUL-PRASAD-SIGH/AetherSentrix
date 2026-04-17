from setuptools import setup, find_packages

setup(
    name="aethersentrix-soc-engine",
    version="0.1.0",
    description="AI-driven threat detection and simulation engine for hackathon demo",
    long_description=open("README.md", "r", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    author="AetherSentrix Team",
    packages=find_packages(include=["pipeline", "pipeline.*", "demo"]),
    python_requires=">=3.8",
    install_requires=[
        "python-dateutil>=2.8.2",
        "numpy>=1.24.0",
        "pandas>=2.0.0",
        "scikit-learn>=1.2.0",
        "xgboost>=1.7.0",
    ],
    entry_points={
        "console_scripts": [
            "aethersentrix-demo=main:run_demo",
        ],
    },
)
