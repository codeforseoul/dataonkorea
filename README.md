## Data on Korea
아래 [CSV 양식](#CSV-FORMAT)에 맞는 데이터를 올리면 자동으로 코로플래스 지도(Choropleth Map) 형태로 시각화

![demo](./demo.gif)

#### How it works
``name``과 ``data`` 칼럼을 갖고 각 ``name`` 칼럼에는 아래 지방 이름이, ``data`` 칼럼에는 각 지방에 해당하는 ``Numeric`` 데이터가 포함된 ``csv`` 파일을 업로드하면 데이터에 맞게 지도가 그려집니다.

###### CSV Format
* Columns
  * name
  * data

* Name of Provinces(column: name)
  * Chungcheongnam-do(충청남도)
  * Chungcheongbuk-do(충청북도)
  * Gangwon-do(강원도)
  * Gwangju(광주광역시)
  * Gyeongsangnam-do(경상남도)
  * Gyeongsangbuk-do(경상북도)
  * Gyeonggji-do(경기도)
  * Daegu(대구광역시)
  * Daejeon(대전광역시)
  * Seoul(서울특별시)
  * Sejongsi(세종시)
  * Ulsan(울산광역시)
  * Incheon(인천광역시)
  * Jeollanam-do(전라남도)
  * Jeollabuk-do(전라북도)
  * Jeju-do(제주도)

#### Roadmap
* manipulation(selection) data(format) on the webpage
* various map types
* [Multiview](http://okfnlabs.org/recline/docs/tutorial-multiview.html)- [Recline.js](http://okfnlabs.org/recline)
* various ways to upload file or data

#### References
* [우리나라 도시별 인구수 시각화](https://gist.github.com/e9t/826b20ae75b331f56b4e?short_path=09ed2de) - [Lucy Park](http://lucypark.kr/)
* [D3: Queue.js](http://bl.ocks.org/mapsam/6090056) - [Sam Matthews](https://github.com/mapsam)

#### Open Sources
* [Recline.js](http://okfnlabs.org/recline)
* [D3.js](http://d3js.org/)

#### LICENSE
[APACHE LICENSE](LICENSE)
