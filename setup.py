from setuptools import find_pakages, setup

setup(
    name="web_tabletop",
    version="0.0.1",
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        "flask",
    ],
)