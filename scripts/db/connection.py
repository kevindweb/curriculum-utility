from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

engine = create_engine('mysql://sd:Secretdontshare4321!@curriculum-utility.c2vkrbtsivkl.us-east-1.rds.amazonaws.com:3306/alekevino?charset=utf8mb4')
Session = sessionmaker(bind=engine)